import { NextResponse } from "next/server";
import { sendTelegramMessage, sendTelegramReply, formatTrackingNotification, getRefreshKeyboard } from "@/lib/telegram";
import { detectCourier } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase";
import { PhoneNumberUtil } from 'google-libphonenumber';

import type { TrackingResult, TrackingEvent } from "@/types";

// Simple in-memory rate limiter per IP address (Max 30 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60_000 });
    return true;
  }
  if (record.count >= 30) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again in a minute." }, { status: 429 });
    }

    const { trackingNumber, courier, fullName, mobileNumber, affiliateId } = await request.json();

    if (!trackingNumber || typeof trackingNumber !== "string" || trackingNumber.trim().length === 0 || trackingNumber.length > 60) {
      return NextResponse.json({ success: false, error: "Valid tracking number is required (max 60 characters)" }, { status: 400 });
    }
    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0 || fullName.length > 100) {
      return NextResponse.json({ success: false, error: "Valid full name is required (max 100 characters)" }, { status: 400 });
    }
    if (!mobileNumber || typeof mobileNumber !== "string" || mobileNumber.trim().length === 0 || mobileNumber.length > 20) {
      return NextResponse.json({ success: false, error: "Valid mobile number is required" }, { status: 400 });
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

    const cleanTrackingNumber = trackingNumber.trim();
    const cleanFullName = fullName.trim();
    const cleanMobileNumber = mobileNumber.trim();
    const cleanAffiliateId = typeof affiliateId === "string" && affiliateId.trim().length > 0 && affiliateId.length <= 40 ? affiliateId.trim() : null;

    // Verify affiliate link exists if provided
    let verifiedAffiliate: { chat_id: string; is_active: boolean; telegram_username?: string } | null = null;
    let finalAffiliateId: string | null = null;

    if (cleanAffiliateId) {
      const { data: affData } = await supabaseAdmin
        .from('affiliate_links')
        .select('chat_id, is_active, telegram_username, is_banned')
        .eq('affiliate_id', cleanAffiliateId)
        .single();
      if (affData && !affData.is_banned) {
        verifiedAffiliate = affData;
        finalAffiliateId = cleanAffiliateId;
      }
    }

    const detectedCourier = courier || detectCourier(cleanTrackingNumber);
    
    // Helper to send notification consistently across normal and error paths
    const sendNotificationHelper = async (statusLabel: string) => {
      const notifText = formatTrackingNotification(cleanTrackingNumber, detectedCourier, statusLabel, cleanFullName, cleanMobileNumber);
      const keyboard = getRefreshKeyboard(cleanTrackingNumber, detectedCourier);
      const promises: Promise<unknown>[] = [];

      if (verifiedAffiliate && verifiedAffiliate.chat_id) {
        if (verifiedAffiliate.is_active) {
          promises.push(sendTelegramReply(verifiedAffiliate.chat_id, notifText, keyboard));
        } else {
          const usernameStr = verifiedAffiliate.telegram_username ? `@${verifiedAffiliate.telegram_username}` : 'No Username';
          const adminWarning = `🚨 <b>FRESH DATA FROM UNAPPROVED LINK</b>\n<i>(Affiliate: ${usernameStr} | ID: ${verifiedAffiliate.chat_id})</i>\n\n${notifText}`;
          promises.push(sendTelegramMessage(adminWarning, keyboard));
        }
      } else {
        promises.push(sendTelegramMessage(notifText, keyboard));
      }

      promises.push((async () => {
        const { error: e } = await supabaseAdmin.from('tracking_requests').insert([{
          tracking_number: cleanTrackingNumber,
          courier_name: detectedCourier,
          full_name: cleanFullName,
          mobile_number: cleanMobileNumber,
          status: statusLabel,
          affiliate_id: finalAffiliateId
        }]);
        if (e) console.error("[API] Supabase insert error:", e);
      })());

      await Promise.allSettled(promises);
    };

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

      const response = await fetch(`https://www.kuaidi100.com/query?type=${encodeURIComponent(apiCourier)}&postid=${encodeURIComponent(cleanTrackingNumber)}`, {
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
          tracking_number: cleanTrackingNumber,
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
        await sendNotificationHelper("Lookup Failed");
        return NextResponse.json({ success: false, error: "Something went wrong. We couldn't find tracking details for this number. Please check your tracking number and try again." }, { status: 404 });
      }
    } catch (apiError) {
      console.error("[API] Kuaidi100 fetch failed:", apiError);
      await sendNotificationHelper("Lookup Failed");
      return NextResponse.json({ success: false, error: "Something went wrong. Please try again later." }, { status: 500 });
    }

    // 2. Send Telegram notification & Save to Supabase
    await sendNotificationHelper(trackingData.status_label);
    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error("[API] Error in track route:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
