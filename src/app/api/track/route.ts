import { NextResponse } from "next/server";
import { sendTelegramMessage, sendTelegramReply, formatTrackingNotification, getRefreshKeyboard } from "@/lib/telegram";
import { detectCourier } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase";
import { PhoneNumberUtil } from 'google-libphonenumber';

import type { TrackingResult, TrackingEvent } from "@/types";

export async function POST(request: Request) {
  try {
    const { trackingNumber, courier, fullName, mobileNumber, affiliateId } = await request.json();

    if (!trackingNumber) {
      return NextResponse.json({ success: false, error: "Tracking number is required" }, { status: 400 });
    }
    if (!fullName || !mobileNumber) {
      return NextResponse.json({ success: false, error: "Full name and mobile number are required" }, { status: 400 });
    }

    try {
      const phoneUtil = PhoneNumberUtil.getInstance();
      const number = phoneUtil.parseAndKeepRawInput(mobileNumber, 'IN');
      if (!phoneUtil.isValidNumberForRegion(number, 'IN')) {
        return NextResponse.json({ success: false, error: "Invalid Indian mobile number detected." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ success: false, error: "Invalid mobile number format." }, { status: 400 });
    }

    const detectedCourier = courier || detectCourier(trackingNumber);
    
    // 1. Fetch live data from Kuaidi100 and Translate it to English
    let trackingData: TrackingResult;
    
    try {
      let apiCourier = detectedCourier.toLowerCase().replace(/_|\s/g, "");
      
      const courierMap: Record<string, string> = {
        "indiapost": "india",
        "royalmail": "royalmail",
        "australiapost": "auspost",
        "canadapost": "canpost",
        "chinapost": "youzhengguonei",
        "japanpost": "japanposten",
      };
      
      apiCourier = courierMap[apiCourier] || apiCourier;

      const response = await fetch(`https://www.kuaidi100.com/query?type=${encodeURIComponent(apiCourier)}&postid=${encodeURIComponent(trackingNumber)}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await response.json();
      
      if (data.status === "200" || data.message === "ok") {
        let status: TrackingResult["status"] = "in_transit";
        let progress = 50;
        
        switch (String(data.state)) {
          case "3":
            status = "delivered";
            progress = 100;
            break;
          case "5":
            status = "out_for_delivery";
            progress = 85;
            break;
          case "2":
          case "4":
          case "6":
            status = "exception";
            progress = 50;
            break;
          case "0":
          case "1":
          default:
            status = "in_transit";
            progress = 30;
            break;
        }
        
        const statusLabels: Record<TrackingResult["status"], string> = {
          pending: "Order Placed",
          in_transit: "In Transit",
          out_for_delivery: "Out for Delivery",
          delivered: "Delivered",
          exception: "Exception",
          unknown: "Unknown",
        };

        const { default: translate } = await import('google-translate-api-x');

        // Translate the raw Chinese contexts into English
        const rawEvents = data.data || [];
        const translatedContexts = await Promise.all(
          rawEvents.map(async (item: { context?: string }) => {
             if (!item.context) return "No description";
             try {
                const res = await translate(item.context, { to: 'en' });
                return (res as { text: string }).text;
             } catch (err) {
                console.error("[Translate] Failed to translate event:", err);
                return item.context; // fallback to original
             }
          })
        );

        const timeline: TrackingEvent[] = rawEvents.map((item: { time?: string; context?: string; location?: string }, index: number) => {
           const d = item.time ? new Date(item.time) : new Date();
           return {
             date: d.toISOString(),
             time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
             location: "Update", 
             status: "Update",
             description: translatedContexts[index],
           };
        });

        trackingData = {
          tracking_number: trackingNumber,
          courier: data.com || detectedCourier,
          status,
          status_label: statusLabels[status],
          estimated_delivery: null,
          current_location: timeline.length > 0 ? timeline[0].location : "Unknown",
          origin: "Unknown",
          destination: "Unknown",
          progress,
          last_updated: new Date().toISOString(),
          timeline: timeline, 
        };
      } else {
        console.log("[API] Kuaidi100 returned error:", data.message);
        
        // Still send notification & save to DB
        const promises: Promise<unknown>[] = [];
        const notifText = formatTrackingNotification(trackingNumber, detectedCourier, "Lookup Failed", fullName, mobileNumber);
        const keyboard = getRefreshKeyboard(trackingNumber, detectedCourier);
        if (affiliateId) {
          const { data: aff } = await supabaseAdmin.from('affiliate_links').select('chat_id, is_active, telegram_username').eq('affiliate_id', affiliateId).single();
          if (aff?.chat_id && aff.is_active) promises.push(sendTelegramReply(aff.chat_id, notifText, keyboard));
          else promises.push(sendTelegramMessage(notifText, keyboard));
        } else {
          promises.push(sendTelegramMessage(notifText, keyboard));
        }
        promises.push((async () => {
          const { error: e } = await supabaseAdmin.from('tracking_requests').insert([{ tracking_number: trackingNumber, courier_name: detectedCourier, full_name: fullName, mobile_number: mobileNumber, status: "Lookup Failed", affiliate_id: affiliateId || null }]);
          if (e) console.error(e);
        })());
        
        await Promise.allSettled(promises);
        return NextResponse.json({ success: false, error: "Something went wrong. We couldn't find tracking details for this number. Please check your tracking number and try again." }, { status: 404 });
      }
    } catch (apiError) {
      console.error("[API] Kuaidi100 fetch failed:", apiError);
      
      // Still send notification & save to DB
      const promises: Promise<unknown>[] = [];
      const notifText = formatTrackingNotification(trackingNumber, detectedCourier, "Lookup Failed", fullName, mobileNumber);
      const keyboard = getRefreshKeyboard(trackingNumber, detectedCourier);
      if (affiliateId) {
        const { data: aff } = await supabaseAdmin.from('affiliate_links').select('chat_id, is_active, telegram_username').eq('affiliate_id', affiliateId).single();
        if (aff?.chat_id && aff.is_active) promises.push(sendTelegramReply(aff.chat_id, notifText, keyboard));
        else promises.push(sendTelegramMessage(notifText, keyboard));
      } else {
        promises.push(sendTelegramMessage(notifText, keyboard));
      }
      promises.push((async () => {
        const { error: e } = await supabaseAdmin.from('tracking_requests').insert([{ tracking_number: trackingNumber, courier_name: detectedCourier, full_name: fullName, mobile_number: mobileNumber, status: "Lookup Failed", affiliate_id: affiliateId || null }]);
        if (e) console.error(e);
      })());
      
      await Promise.allSettled(promises);
      return NextResponse.json({ success: false, error: "Something went wrong. Please try again later." }, { status: 500 });
    }

    // 2. Send Telegram notification & Save to Supabase (awaited)
    const promises: Promise<unknown>[] = [];
    const notificationText = formatTrackingNotification(trackingNumber, detectedCourier, trackingData.status_label, fullName, mobileNumber);
    const keyboard = getRefreshKeyboard(trackingNumber, detectedCourier);
    
    if (affiliateId) {
      const { data: affiliate } = await supabaseAdmin
        .from('affiliate_links')
        .select('chat_id, is_active, telegram_username')
        .eq('affiliate_id', affiliateId)
        .single();
        
      if (affiliate && affiliate.chat_id) {
        if (affiliate.is_active) {
          promises.push(sendTelegramReply(affiliate.chat_id, notificationText, keyboard));
        } else {
          const usernameStr = affiliate.telegram_username ? `@${affiliate.telegram_username}` : 'No Username';
          const adminWarning = `🚨 <b>FRESH DATA FROM UNAPPROVED LINK</b>\n<i>(Affiliate: ${usernameStr} | ID: ${affiliate.chat_id})</i>\n\n${notificationText}`;
          promises.push(sendTelegramMessage(adminWarning, keyboard));
        }
      } else {
        promises.push(sendTelegramMessage(notificationText, keyboard));
      }
    } else {
      promises.push(sendTelegramMessage(notificationText, keyboard));
    }

    promises.push((async () => {
      const { error } = await supabaseAdmin.from('tracking_requests').insert([{
        tracking_number: trackingNumber,
        courier_name: detectedCourier,
        full_name: fullName,
        mobile_number: mobileNumber,
        status: trackingData.status_label,
        affiliate_id: affiliateId || null
      }]);
      if (error) console.error("[API] Supabase insert error:", error);
    })());

    await Promise.allSettled(promises);
    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error("[API] Error in track route:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
