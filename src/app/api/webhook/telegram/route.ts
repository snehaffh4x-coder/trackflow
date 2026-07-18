import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramReply } from '@/lib/telegram';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// Required for Telegram Webhook
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"; // Ensure this is set in Vercel

export async function POST(req: Request) {
  try {
    // 1. Security: Verify Telegram Secret Token (if set in .env)
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedToken = process.env.TELEGRAM_SECRET_TOKEN;
    if (expectedToken && secretToken !== expectedToken) {
      console.warn("Unauthorized webhook attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 2. Check for callback query (e.g. from Inline Keyboard Refresh button)
    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id;
      const callbackData = body.callback_query.data || "";
      const chatId = String(body.callback_query.message?.chat?.id || "");
      
      // NOTE: We do NOT auto-answer here. Each handler answers with its own contextual text.
      // Answering prematurely shows wrong text (e.g., "Fetching..." when user clicks Approve).

      const callerChatId = String(body.callback_query.from?.id || body.callback_query.message?.chat?.id || "");
      const callerUsername = (body.callback_query.from?.username || "").toLowerCase();
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      const isAdmin = callerChatId === adminChatId && callerUsername === 'cozy_look';

      if (callbackData.startsWith("appr_") || callbackData.startsWith("rejc_") || callbackData.startsWith("unban_") || callbackData.startsWith("ban_")) {
        // Strict security verification: ONLY Admin (@cozy_look and matching TELEGRAM_CHAT_ID) can approve/reject/ban
        if (!isAdmin) {
          if (BOT_TOKEN && callbackQueryId) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: "❌ SECURITY ALERT: Only Admin (@cozy_look) is authorized to accept, reject, or ban affiliates!",
                show_alert: true
              })
            }).catch(console.error);
          }
          return NextResponse.json({ ok: true });
        }

        if (callbackData.startsWith("appr_")) {
          const targetChatId = callbackData.replace("appr_", "");
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .update({ is_active: true, is_banned: false, ban_reason: null })
            .eq('chat_id', targetChatId)
            .select()
            .single();

          if (error || !data) {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: `❌ Failed: Chat ID ${targetChatId} not found.`,
                  show_alert: true
                })
              }).catch(console.error);
            }
          } else {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: "✅ Approved successfully!",
                  show_alert: false
                })
              }).catch(console.error);
            }
            await sendTelegramReply(callerChatId, `✅ Successfully approved Chat ID <code>${targetChatId}</code> (@${data.telegram_username || 'user'})! Their link is now ACTIVE.`);
            await sendTelegramReply(
              targetChatId,
              `🎉 <b>Congratulations!</b>\n\nYour subscription is now <b>ACTIVE</b>.\nAny tracking data from your link will now be sent directly to you here!\n\n🔑 <b>Your Login ID (Chat ID):</b>\n<code>${targetChatId}</code>\n\n🌐 <b>Web Panel Login:</b>\n<code>${DOMAIN}/affiliate</code>\n\nCopy your Chat ID and paste it in the Web Panel to request a secure OTP and login!`
            );
          }
        } else if (callbackData.startsWith("rejc_")) {
          const targetChatId = callbackData.replace("rejc_", "");
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .update({ is_active: false })
            .eq('chat_id', targetChatId)
            .select()
            .single();

          if (error || !data) {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: `❌ Failed: Chat ID ${targetChatId} not found.`,
                  show_alert: true
                })
              }).catch(console.error);
            }
          } else {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: "⏸️ Rejected / Suspended!",
                  show_alert: false
                })
              }).catch(console.error);
            }
            await sendTelegramReply(callerChatId, `⏸️ Successfully suspended Chat ID <code>${targetChatId}</code> (@${data.telegram_username || 'user'})! Their link is now INACTIVE.`);
            await sendTelegramReply(targetChatId, `⏸️ <b>Link Suspended</b>\n\nYour affiliate link has been deactivated by Admin. If you think this is a mistake, please contact @cozy_look.`);
          }
        } else if (callbackData.startsWith("unban_")) {
          const targetChatId = callbackData.replace("unban_", "");
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .update({ is_banned: false, ban_reason: null })
            .eq('chat_id', targetChatId)
            .select()
            .single();

          if (error || !data) {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: `❌ Failed to unban: Chat ID ${targetChatId} not found.`,
                  show_alert: true
                })
              }).catch(console.error);
            }
          } else {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: "♻️ Affiliate unbanned!",
                  show_alert: false
                })
              }).catch(console.error);
            }
            await sendTelegramReply(callerChatId, `♻️ Successfully unbanned and restored Chat ID <code>${targetChatId}</code> (@${data.telegram_username || 'user'})!`);
            await sendTelegramReply(targetChatId, `♻️ <b>Account Restored</b>\n\nYour affiliate ban has been lifted by Admin. You can now generate links via /start or check tracking stats.`);
          }
        } else if (callbackData.startsWith("ban_")) {
          const targetChatId = callbackData.replace("ban_", "");
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .update({ is_banned: true, is_active: false, ban_reason: "Violation of affiliate terms & excessive spam" })
            .eq('chat_id', targetChatId)
            .select()
            .single();

          if (error || !data) {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: `❌ Failed to ban: Chat ID ${targetChatId} not found.`,
                  show_alert: true
                })
              }).catch(console.error);
            }
          } else {
            if (BOT_TOKEN && callbackQueryId) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackQueryId,
                  text: "🚫 Affiliate banned successfully!",
                  show_alert: false
                })
              }).catch(console.error);
            }
            await sendTelegramReply(callerChatId, `🚫 Successfully banned Chat ID <code>${targetChatId}</code> (@${data.telegram_username || 'user'})!`);
            await sendTelegramReply(targetChatId, `🚫 <b>Account Banned</b>\n\nYour promotional link has been suspended and banned. Contact @cozy_look if you believe this is an error.`);
          }
        }
        return NextResponse.json({ ok: true });
      }

      if (callbackData.startsWith("ref_")) {
        // Answer callback for refresh-type actions
        if (BOT_TOKEN && callbackQueryId) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, text: "🔄 Fetching live status..." })
          }).catch(console.error);
        }
        const parts = callbackData.split("_");
        const trackingNumber = parts[1];
        const courier = parts.slice(2).join("_") || "Auto";

        if (trackingNumber) {
          const { fetchLiveTrackingStatus } = await import("@/lib/tracking-service");
          const { getRefreshKeyboard } = await import("@/lib/telegram");
          
          const result = await fetchLiveTrackingStatus(trackingNumber, courier);
          const now = new Date().toLocaleString("en-US", { timeZone: "UTC" });
          const keyboard = getRefreshKeyboard(trackingNumber, courier);

          const { data: dbRows } = await supabaseAdmin
            .from('tracking_requests')
            .select('full_name, mobile_number, affiliate_id')
            .eq('tracking_number', trackingNumber)
            .order('created_at', { ascending: false })
            .limit(1);

          // Security Audit check: Verify if caller is Admin or exact active owner of this lead
          let isOwner = isAdmin;
          if (!isAdmin) {
            const { data: aff } = await supabaseAdmin
              .from('affiliate_links')
              .select('affiliate_id, is_active')
              .eq('chat_id', callerChatId)
              .single();
            if (aff?.affiliate_id && aff.is_active && dbRows?.[0]?.affiliate_id === aff.affiliate_id) {
              isOwner = true;
            }
          }

          const customerName = isOwner ? (dbRows?.[0]?.full_name || "N/A") : "🔒 [Protected/Hidden]";
          const customerPhone = isOwner ? (dbRows?.[0]?.mobile_number || "N/A") : "🔒 [Protected/Hidden]";

          if (result.success && result.data) {
            const data = result.data;
            let timelineText = "• No recent timeline entries right now.";
            if (data.timeline && data.timeline.length > 0) {
              timelineText = data.timeline
                .slice(0, 5)
                .map(e => `🔹 <b>${e.date ? e.date.split('T')[0] : ''} ${e.time || ''}</b>\n   └ ${e.description || 'Status update'}`)
                .join("\n\n");
            }
            const replyText = `⚡ <b>LIVE REFRESHED TRACKING STATUS</b> ⚡\n\n` +
              `👤 Customer Name: <b>${customerName}</b>\n` +
              `📱 Mobile Number: <code>${customerPhone}</code>\n` +
              `🔢 Tracking ID: <code>${trackingNumber}</code>\n` +
              `🚚 Courier: <b>${data.courier || courier}</b>\n` +
              `📊 Status: <b>${data.status_label}</b> (${data.progress || 0}%)\n` +
              `📍 Current Location: ${data.current_location || 'Transit'}\n\n` +
              `⏳ <b>Latest Recent Updates (Top 5):</b>\n${timelineText}\n\n` +
              `🕐 Refreshed At (UTC): ${now}`;
            
            await sendTelegramReply(chatId, replyText, keyboard);
          } else {
            const replyText = `❌ <b>Live Refresh Failed</b>\n\n👤 Customer: <b>${customerName}</b> (<code>${customerPhone}</code>)\n🔢 Tracking ID: <code>${trackingNumber}</code> (${courier})\nReason: ${result.error || "Courier server busy or tracking not found"}\n🕐 Checked At (UTC): ${now}`;
            await sendTelegramReply(chatId, replyText, keyboard);
          }
        }
      } else if (callbackData.startsWith("pkgexp_")) {
        if (BOT_TOKEN && callbackQueryId) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, text: "📄 Generating package report..." })
          }).catch(console.error);
        }
        const parts = callbackData.split("_");
        const trackingNumber = parts[1];
        const courier = parts.slice(2).join("_") || "Auto";

        if (trackingNumber) {
          const { data: dbRows } = await supabaseAdmin
            .from('tracking_requests')
            .select('full_name, mobile_number, affiliate_id, created_at')
            .eq('tracking_number', trackingNumber)
            .order('created_at', { ascending: false })
            .limit(1);

          // Strict Security Check: Only Admin or active owner can download full package history with PII
          let isOwner = isAdmin;
          if (!isAdmin) {
            const { data: aff } = await supabaseAdmin
              .from('affiliate_links')
              .select('affiliate_id, is_active')
              .eq('chat_id', callerChatId)
              .single();
            if (aff?.affiliate_id && aff.is_active && dbRows?.[0]?.affiliate_id === aff.affiliate_id) {
              isOwner = true;
            }
          }

          if (!isOwner) {
            await sendTelegramReply(chatId, "❌ Access Denied: You can only export package history for leads generated through your own active affiliate link.");
            return NextResponse.json({ ok: true });
          }

          const { fetchLiveTrackingStatus } = await import("@/lib/tracking-service");
          const { sendTelegramDocument } = await import("@/lib/telegram");
          const result = await fetchLiveTrackingStatus(trackingNumber, courier);

          const customerName = dbRows?.[0]?.full_name || "N/A (Direct query)";
          const customerPhone = dbRows?.[0]?.mobile_number || "N/A";
          const affiliateSource = dbRows?.[0]?.affiliate_id ? `Affiliate (${dbRows[0].affiliate_id})` : "Direct Website Search";
          const firstSearchedAt = dbRows?.[0]?.created_at || new Date().toISOString();

          if (result.success && result.data) {
            const data = result.data;
            let fileContent = `========================================================\n`;
            fileContent += `          TRACKFLOW — A-TO-Z PACKAGE REPORT           \n`;
            fileContent += `========================================================\n\n`;
            fileContent += `[CUSTOMER DETAILS]\n`;
            fileContent += `Customer Name   : ${customerName}\n`;
            fileContent += `Mobile Number   : ${customerPhone}\n`;
            fileContent += `Search Source   : ${affiliateSource}\n`;
            fileContent += `First Tracked At: ${firstSearchedAt}\n\n`;
            fileContent += `--------------------------------------------------------\n`;
            fileContent += `[SHIPMENT STATUS]\n`;
            fileContent += `Tracking Number : ${trackingNumber}\n`;
            fileContent += `Courier         : ${data.courier || courier}\n`;
            fileContent += `Current Status  : ${data.status_label} (${data.progress}%)\n`;
            fileContent += `Current Location: ${data.current_location}\n`;
            fileContent += `Report Generated: ${new Date().toUTCString()}\n\n`;
            fileContent += `--------------------------------------------------------\n`;
            fileContent += `[FULL TIMELINE HISTORY / A-TO-Z LOGS]\n`;
            fileContent += `--------------------------------------------------------\n\n`;

            if (data.timeline && data.timeline.length > 0) {
              data.timeline.forEach((event, idx) => {
                fileContent += `[Update #${idx + 1}] Date & Time: ${event.date ? event.date.split('T')[0] : ''} ${event.time || ''}\n`;
                fileContent += `             Location   : ${event.location || 'Update'}\n`;
                fileContent += `             Description: ${event.description || 'No details'}\n\n`;
              });
            } else {
              fileContent += `No detailed timeline events available from courier right now.\n`;
            }

            await sendTelegramDocument(
              chatId,
              `package_history_${trackingNumber}.txt`,
              fileContent,
              "text/plain",
              `📄 <b>Complete A-to-Z Package Report!</b>\nAll customer info (Name/Mobile) & complete history for <code>${trackingNumber}</code> are in this document.`
            );
          } else {
            await sendTelegramReply(chatId, `❌ Could not export package history right now. Reason: ${result.error || "Courier API busy"}`);
          }
        }
      } else if (callbackData === "export_all_csv") {
        if (BOT_TOKEN && callbackQueryId) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, text: "📊 Preparing export..." })
          }).catch(console.error);
        }
        const { sendTelegramDocument } = await import("@/lib/telegram");
        let query = supabaseAdmin
          .from('tracking_requests')
          .select('tracking_number, courier_name, status, full_name, mobile_number, affiliate_id, created_at')
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          const { data: aff } = await supabaseAdmin
            .from('affiliate_links')
            .select('affiliate_id, is_active')
            .eq('chat_id', callerChatId)
            .single();
          if (aff?.affiliate_id && aff.is_active) {
            query = query.eq('affiliate_id', aff.affiliate_id);
          } else {
            await sendTelegramReply(chatId, "❌ Access Denied: Only ACTIVE (approved) affiliates and Admin are allowed to export leads.");
            return NextResponse.json({ ok: true });
          }
        }

        const { data: rows, error } = await query;
        if (error || !rows || rows.length === 0) {
          await sendTelegramReply(chatId, "❌ No tracking records found to export.");
          return NextResponse.json({ ok: true });
        }

        const { consolidateTrackingRows, generateLeadsSummaryTxt } = await import("@/lib/telegram");
        const consolidatedRows = consolidateTrackingRows(rows);

        const headers = ["Tracking Number", "Courier", "Status", "Full Name", "Mobile Number", "Total Search Attempts (Try Count)", "Affiliate ID", "Latest Searched At"];
        const csvRows = consolidatedRows.map(row => [
          `"${(row.tracking_number || '').replace(/"/g, '""')}"`,
          `"${(row.courier_name || '').replace(/"/g, '""')}"`,
          `"${(row.status || '').replace(/"/g, '""')}"`,
          `"${(row.full_name || '').replace(/"/g, '""')}"`,
          `"${(row.mobile_number || '').replace(/"/g, '""')}"`,
          `"${row.try_count || 1}"`,
          `"${(row.affiliate_id || 'Direct/System').replace(/"/g, '""')}"`,
          `"${(row.created_at || '').replace(/"/g, '""')}"`,
        ].join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const csvFilename = isAdmin ? `trackflow_all_tracking_export_${new Date().toISOString().slice(0, 10)}.csv` : `trackflow_my_leads_${new Date().toISOString().slice(0, 10)}.csv`;
        const title = isAdmin ? "📊 <b>All Platform Leads Data</b>" : "📊 <b>Your Affiliate Leads Data</b>";

        await sendTelegramDocument(
          chatId,
          csvFilename,
          csvContent,
          "text/csv",
          `${title} (CSV Format)\nTotal Consolidated Leads: <b>${consolidatedRows.length}</b> (Grouped from ${rows.length} total search attempts)`
        );

        const txtContent = generateLeadsSummaryTxt(consolidatedRows, isAdmin);
        const txtFilename = isAdmin ? `trackflow_all_leads_summary_${new Date().toISOString().slice(0, 10)}.txt` : `trackflow_my_leads_summary_${new Date().toISOString().slice(0, 10)}.txt`;

        await sendTelegramDocument(
          chatId,
          txtFilename,
          txtContent,
          "text/plain",
          `📄 <b>${title} (TXT Readable Format)</b>\nFormatted cleanly just like Telegram alerts so you can easily read & review all ${consolidatedRows.length} leads without Excel!`
        );
      } else if (callbackData.startsWith("admin_btn_")) {
        if (!isAdmin) {
          if (BOT_TOKEN && callbackQueryId) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callback_query_id: callbackQueryId, text: "❌ Admin Access Only", show_alert: true })
            }).catch(console.error);
          }
          return NextResponse.json({ ok: true });
        }

        if (callbackData === "admin_btn_pending") {
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .select('chat_id, telegram_username, created_at')
            .eq('is_active', false)
            .eq('is_banned', false)
            .order('created_at', { ascending: false });

          if (error || !data || data.length === 0) {
            await sendTelegramReply(callerChatId, "✅ No pending approval requests right now.");
          } else {
            await sendTelegramReply(callerChatId, `📋 <b>Pending Approvals Found: ${data.length}</b>\nClick buttons to approve or reject:`);
            for (const req of data) {
              const cardText = `⏳ <b>Pending Affiliate Request</b>\n\n👤 Username: @${req.telegram_username || 'unknown'}\n💬 Chat ID: <code>${req.chat_id}</code>\n🕐 Registered: ${new Date(req.created_at || Date.now()).toLocaleString()}`;
              await sendTelegramReply(callerChatId, cardText, {
                inline_keyboard: [
                  [
                    { text: `✅ Accept (@${req.telegram_username || 'user'})`, callback_data: `appr_${req.chat_id}` },
                    { text: `❌ Reject (@${req.telegram_username || 'user'})`, callback_data: `rejc_${req.chat_id}` }
                  ]
                ]
              });
            }
          }
        } else if (callbackData === "admin_btn_affiliates") {
          const { data, error } = await supabaseAdmin
            .from('affiliate_links')
            .select('chat_id, affiliate_id, telegram_username, is_active, is_banned, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

          if (error || !data || data.length === 0) {
            await sendTelegramReply(callerChatId, "ℹ️ No affiliates found in the database.");
          } else {
            await sendTelegramReply(callerChatId, `👥 <b>Top Affiliates List</b>\nUse inline buttons to manage:`);
            for (const aff of data) {
              const statusStr = aff.is_banned ? "🚫 BANNED" : aff.is_active ? "✅ ACTIVE" : "⏳ PENDING";
              const cardText = `👥 <b>Affiliate Profile</b>\n\n👤 Username: @${aff.telegram_username || 'N/A'}\n💬 Chat ID: <code>${aff.chat_id}</code>\n🔗 Ref ID: <code>${aff.affiliate_id}</code>\n📊 Status: <b>${statusStr}</b>\n🕐 Registered: ${new Date(aff.created_at || Date.now()).toLocaleDateString()}`;
              const buttons = [];
              if (aff.is_banned) {
                buttons.push([{ text: `♻️ Unban / Restore`, callback_data: `unban_${aff.chat_id}` }]);
              } else if (aff.is_active) {
                buttons.push([
                  { text: `⏸️ Suspend`, callback_data: `rejc_${aff.chat_id}` },
                  { text: `🚫 Ban`, callback_data: `ban_${aff.chat_id}` }
                ]);
              } else {
                buttons.push([
                  { text: `✅ Approve`, callback_data: `appr_${aff.chat_id}` },
                  { text: `❌ Reject`, callback_data: `rejc_${aff.chat_id}` }
                ]);
                buttons.push([{ text: `🚫 Ban Permanently`, callback_data: `ban_${aff.chat_id}` }]);
              }
              await sendTelegramReply(callerChatId, cardText, { inline_keyboard: buttons });
            }
          }
        } else if (callbackData === "admin_btn_export_txt") {
          const { consolidateTrackingRows, generateLeadsSummaryTxt, sendTelegramDocument } = await import("@/lib/telegram");
          const { data: rows } = await supabaseAdmin.from('tracking_requests').select('*').order('created_at', { ascending: false });
          const consolidated = consolidateTrackingRows(rows || []);
          const txtContent = generateLeadsSummaryTxt(consolidated, true);
          await sendTelegramDocument(callerChatId, `trackflow_all_leads_${new Date().toISOString().slice(0, 10)}.txt`, txtContent, "text/plain", "📄 <b>All Leads TXT Report</b>");
        } else if (callbackData === "admin_btn_audit_duplicates") {
          const { data: allRows } = await supabaseAdmin.from('affiliate_links').select('id, chat_id, affiliate_id, created_at').order('created_at', { ascending: false });
          if (!allRows) {
            await sendTelegramReply(callerChatId, "✅ No duplicate entries found.");
          } else {
            const seenChats = new Set<string>();
            const seenLinks = new Set<string>();
            const idsToDelete: string[] = [];
            for (const row of allRows) {
              if (seenChats.has(row.chat_id) || seenLinks.has(row.affiliate_id)) {
                idsToDelete.push(row.id);
              } else {
                seenChats.add(row.chat_id);
                seenLinks.add(row.affiliate_id);
              }
            }
            if (idsToDelete.length > 0) {
              await supabaseAdmin.from('affiliate_links').delete().in('id', idsToDelete);
              await sendTelegramReply(callerChatId, `🛡️ <b>Duplicate Audit Completed!</b>\nCleaned up ${idsToDelete.length} duplicate link entries.`);
            } else {
              await sendTelegramReply(callerChatId, `🛡️ <b>Duplicate Audit Completed!</b>\nDatabase is 100% clean. Zero duplicates found.`);
            }
          }
        } else if (callbackData === "admin_btn_web_panel") {
          await sendTelegramReply(callerChatId, `🌐 <b>TrackFlow Pro Admin Dashboard</b>\n\nLogin URL: <code>${DOMAIN}/admin</code>\n\n🔐 Use your Chat ID and request a Telegram OTP to log in securely.`);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // 3. Verify this is a message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(body.message.chat.id);
    const text = body.message.text.trim();
    const senderUsername = body.message.from?.username || "unknown";

    // Import keyboard helpers
    const { getAdminReplyKeyboard, getAffiliateReplyKeyboard, getAdminMainInlineMenu } = await import("@/lib/telegram");
    const isAdmin = chatId === process.env.TELEGRAM_CHAT_ID && senderUsername.toLowerCase() === 'cozy_look';
    const replyKeyboard = isAdmin ? getAdminReplyKeyboard() : getAffiliateReplyKeyboard();

    // 3. Handle commands & button clicks
    if (text === '🌐 Web Admin Panel' || text === '/admin' || text === '/menu') {
      if (!isAdmin) {
        await sendTelegramReply(chatId, "❌ Admin Access Only.", replyKeyboard);
        return NextResponse.json({ ok: true });
      }
      const menuText = `🚀 <b>TrackFlow Admin Command Center</b>\n\nChoose an action below using the interactive buttons (` +
        `<i>or use your bottom reply keyboard anytime</i>):`;
      await sendTelegramReply(chatId, menuText, getAdminMainInlineMenu());
      await sendTelegramReply(chatId, "⌨️ Bottom keyboard active:", replyKeyboard);
      return NextResponse.json({ ok: true });
    } else if (text === '🔄 Audit Duplicates') {
      if (!isAdmin) {
        await sendTelegramReply(chatId, "❌ Admin Access Only.", replyKeyboard);
        return NextResponse.json({ ok: true });
      }
      const { data: allRows } = await supabaseAdmin.from('affiliate_links').select('id, chat_id, affiliate_id, created_at').order('created_at', { ascending: false });
      if (!allRows) {
        await sendTelegramReply(chatId, "✅ No duplicate entries found.", replyKeyboard);
      } else {
        const seenChats = new Set<string>();
        const seenLinks = new Set<string>();
        const idsToDelete: string[] = [];
        for (const row of allRows) {
          if (seenChats.has(row.chat_id) || seenLinks.has(row.affiliate_id)) {
            idsToDelete.push(row.id);
          } else {
            seenChats.add(row.chat_id);
            seenLinks.add(row.affiliate_id);
          }
        }
        if (idsToDelete.length > 0) {
          await supabaseAdmin.from('affiliate_links').delete().in('id', idsToDelete);
          await sendTelegramReply(chatId, `🛡️ <b>Duplicate Audit Completed!</b>\nCleaned up ${idsToDelete.length} duplicate link entries.`, replyKeyboard);
        } else {
          await sendTelegramReply(chatId, `🛡️ <b>Duplicate Audit Completed!</b>\nDatabase is 100% clean. Zero duplicates found.`, replyKeyboard);
        }
      }
      return NextResponse.json({ ok: true });
    } else if (text === '/setpassword' || text.startsWith('/setpassword ')) {
      await sendTelegramReply(chatId, "❌ Static passwords have been disabled for military-grade security. Please use the new OTP-based login on the web panel.", replyKeyboard);
      return NextResponse.json({ ok: true });
    } else if (text.startsWith('/start') || text.startsWith('/link') || text === '🔗 My Link & Status') {
      // Check if user already has an affiliate link
      const { data: existing } = await supabaseAdmin
        .from('affiliate_links')
        .select('affiliate_id, is_active, is_banned, ban_reason')
        .eq('chat_id', chatId)
        .single();

      if (existing && existing.is_banned) {
        await sendTelegramReply(
          chatId,
          `🚫 <b>Access Banned</b>\n\nYou have been banned from generating promotional links or participating in the affiliate program.\n${existing.ban_reason ? `Reason: <i>${existing.ban_reason}</i>\n\n` : ''}If you believe this is a mistake, please contact @cozy_look.`,
          replyKeyboard
        );
        return NextResponse.json({ ok: true });
      }

      let affiliateId = "";
      let isActive = false;

      if (existing) {
        affiliateId = existing.affiliate_id;
        isActive = existing.is_active;
        await supabaseAdmin.from('affiliate_links').update({ telegram_username: senderUsername }).eq('chat_id', chatId);
      } else {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          affiliateId = nanoid(8);
          const { data: duplicateCheck } = await supabaseAdmin.from('affiliate_links').select('id').eq('affiliate_id', affiliateId).single();
          if (!duplicateCheck) isUnique = true;
          attempts++;
        }
        
        const { error } = await supabaseAdmin
          .from('affiliate_links')
          .insert([{ chat_id: chatId, affiliate_id: affiliateId, telegram_username: senderUsername }]);

        if (error) {
          console.error("Failed to insert affiliate link:", error);
          await sendTelegramReply(chatId, "❌ Sorry, there was an error generating your link. Please try again later.", replyKeyboard);
          return NextResponse.json({ ok: true });
        }
      }

      if (isActive) {
        await sendTelegramReply(
          chatId,
          `👋 Welcome back! Your promotion link is active.\n\n🔗 <b>Your Link:</b>\n<code>${DOMAIN}/?ref=${affiliateId}</code>\n\n🔑 <b>Your Login ID (Chat ID):</b>\n<code>${chatId}</code>\n\n🌐 <b>Web Panel Login:</b>\n<code>${DOMAIN}/${isAdmin ? 'admin' : 'affiliate'}</code>\n\nCopy your Chat ID and paste it in the Web Panel to request a secure OTP and login!`,
          replyKeyboard
        );
      } else {
        await sendTelegramReply(
          chatId,
          `⚠️ <b>Your Link is INACTIVE</b>\n\nWe've generated a unique tracking link for you, but you need a subscription to activate it.\n\n🔗 <b>Your Link:</b>\n<code>${DOMAIN}/?ref=${affiliateId}</code>\n\n<b>How to activate:</b>\nMessage <b>@cozy_look</b> to purchase a subscription.\nSend them your Chat ID: <code>${chatId}</code>\nYour Username: <code>@${senderUsername}</code>`,
          replyKeyboard
        );

        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        if (adminChatId && chatId !== adminChatId) {
          const adminAlertText = `🔔 <b>New Affiliate Registration Request!</b>\n\n👤 Username: @${senderUsername}\n💬 Chat ID: <code>${chatId}</code>\n🔗 Affiliate ID: <code>${affiliateId}</code>\n\n<i>Click below to instantly accept or reject:</i>`;
          const adminKeyboard = {
            inline_keyboard: [
              [
                { text: `✅ Accept (@${senderUsername})`, callback_data: `appr_${chatId}` },
                { text: `❌ Reject (@${senderUsername})`, callback_data: `rejc_${chatId}` }
              ]
            ]
          };
          await sendTelegramReply(adminChatId, adminAlertText, adminKeyboard);
        }
      }
    } else if (text === '/approve' || text.startsWith('/approve ')) {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "❌ Please provide a chat ID. Example: /approve 123456789");
        return NextResponse.json({ ok: true });
      }

      const targetChatId = parts[1].trim();
      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .update({ is_active: true, is_banned: false, ban_reason: null })
        .eq('chat_id', targetChatId)
        .select()
        .single();

      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to approve. Chat ID ${targetChatId} not found.`);
      } else {
        await sendTelegramReply(chatId, `✅ Successfully approved Chat ID ${targetChatId}!`);
        await sendTelegramReply(
          targetChatId,
          `🎉 <b>Congratulations!</b>\n\nYour subscription is now <b>ACTIVE</b>.\nAny tracking data from your link will now be sent directly to you here!\n\n🔑 <b>Your Login ID (Chat ID):</b>\n<code>${targetChatId}</code>\n\n🌐 <b>Web Panel Login:</b>\n<code>${DOMAIN}/affiliate</code>\n\nCopy your Chat ID and paste it in the Web Panel to request a secure OTP and login!`
        );
      }
    } else if (text === '/reject' || text.startsWith('/reject ')) {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "❌ Please provide a chat ID. Example: /reject 123456789");
        return NextResponse.json({ ok: true });
      }

      const targetChatId = parts[1].trim();
      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .update({ is_active: false })
        .eq('chat_id', targetChatId)
        .select()
        .single();

      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to reject. Chat ID ${targetChatId} not found.`);
      } else {
        await sendTelegramReply(chatId, `⏸️ Successfully rejected/suspended Chat ID ${targetChatId}! Their link is now INACTIVE.`);
        await sendTelegramReply(targetChatId, `⏸️ <b>Request Rejected</b>\n\nYour subscription request was rejected. If you think this is a mistake, please contact @cozy_look.`);
      }
    } else if (text.startsWith('/pending') || text === '📋 Pending Approvals') {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .select('chat_id, telegram_username, created_at')
        .eq('is_active', false)
        .eq('is_banned', false)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        await sendTelegramReply(chatId, "✅ No pending approval requests right now.", replyKeyboard);
      } else {
        await sendTelegramReply(chatId, `📋 <b>Pending Approvals Found: ${data.length}</b>\nClick the inline buttons below each card to immediately accept or reject:`, replyKeyboard);
        for (const req of data) {
          const cardText = `⏳ <b>Pending Affiliate Request</b>\n\n👤 Username: @${req.telegram_username || 'unknown'}\n💬 Chat ID: <code>${req.chat_id}</code>\n🕐 Registered: ${new Date(req.created_at || Date.now()).toLocaleString()}`;
          const keyboard = {
            inline_keyboard: [
              [
                { text: `✅ Accept (@${req.telegram_username || 'user'})`, callback_data: `appr_${req.chat_id}` },
                { text: `❌ Reject (@${req.telegram_username || 'user'})`, callback_data: `rejc_${req.chat_id}` }
              ]
            ]
          };
          await sendTelegramReply(chatId, cardText, keyboard);
        }
      }
    } else if (text === '/ban' || text.startsWith('/ban ')) {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "❌ Please provide a chat ID or username. Example: `/ban 123456789 Spamming links`");
        return NextResponse.json({ ok: true });
      }

      const targetIdentifier = parts[1].trim();
      const reason = parts.slice(2).join(" ") || "Violation of affiliate terms & excessive spam";

      let query = supabaseAdmin.from('affiliate_links').update({ is_banned: true, is_active: false, ban_reason: reason });
      if (targetIdentifier.startsWith('@')) {
        query = query.eq('telegram_username', targetIdentifier.replace('@', ''));
      } else {
        query = query.eq('chat_id', targetIdentifier);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to ban. Affiliate <code>${targetIdentifier}</code> not found.`);
      } else {
        await sendTelegramReply(chatId, `🚫 Successfully **BANNED** affiliate <code>${data.chat_id}</code> (@${data.telegram_username || 'user'})!\nReason: ${reason}`);
        await sendTelegramReply(data.chat_id, `🚫 <b>Account Banned</b>\n\nYour promotional link has been suspended and banned due to: <i>${reason}</i>\nYou will no longer receive tracking leads or be able to generate links.`);
      }
    } else if (text === '/unban' || text.startsWith('/unban ')) {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "❌ Please provide a chat ID or username. Example: `/unban 123456789`");
        return NextResponse.json({ ok: true });
      }

      const targetIdentifier = parts[1].trim();
      let query = supabaseAdmin.from('affiliate_links').update({ is_banned: false, ban_reason: null });
      if (targetIdentifier.startsWith('@')) {
        query = query.eq('telegram_username', targetIdentifier.replace('@', ''));
      } else {
        query = query.eq('chat_id', targetIdentifier);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to unban. Affiliate <code>${targetIdentifier}</code> not found.`);
      } else {
        await sendTelegramReply(chatId, `♻️ Successfully **UNBANNED** and restored affiliate <code>${data.chat_id}</code> (@${data.telegram_username || 'user'})!`);
        await sendTelegramReply(data.chat_id, `♻️ <b>Account Restored</b>\n\nYour affiliate ban has been lifted by Admin. You can now generate links via /start or check tracking stats.`);
      }
    } else if (text.startsWith('/affiliates') || text === '👥 All Affiliates') {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .select('chat_id, affiliate_id, telegram_username, is_active, is_banned, created_at')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error || !data || data.length === 0) {
        await sendTelegramReply(chatId, "ℹ️ No affiliates found in the database.", replyKeyboard);
      } else {
        await sendTelegramReply(chatId, `👥 <b>Top 15 Affiliates Summary</b>\nUse inline buttons below each card to manage without typing commands:`, replyKeyboard);
        for (const aff of data) {
          const statusStr = aff.is_banned ? "🚫 BANNED" : aff.is_active ? "✅ ACTIVE" : "⏳ PENDING";
          const cardText = `👥 <b>Affiliate Profile</b>\n\n👤 Username: @${aff.telegram_username || 'N/A'}\n💬 Chat ID: <code>${aff.chat_id}</code>\n🔗 Ref ID: <code>${aff.affiliate_id}</code>\n📊 Status: <b>${statusStr}</b>\n🕐 Registered: ${new Date(aff.created_at || Date.now()).toLocaleDateString()}`;
          
          const buttons = [];
          if (aff.is_banned) {
            buttons.push([{ text: `♻️ Unban / Restore`, callback_data: `unban_${aff.chat_id}` }]);
          } else if (aff.is_active) {
            buttons.push([
              { text: `⏸️ Suspend`, callback_data: `rejc_${aff.chat_id}` },
              { text: `🚫 Ban`, callback_data: `ban_${aff.chat_id}` }
            ]);
          } else {
            buttons.push([
              { text: `✅ Approve`, callback_data: `appr_${aff.chat_id}` },
              { text: `❌ Reject`, callback_data: `rejc_${aff.chat_id}` }
            ]);
            buttons.push([{ text: `🚫 Ban Permanently`, callback_data: `ban_${aff.chat_id}` }]);
          }

          await sendTelegramReply(chatId, cardText, { inline_keyboard: buttons });
        }
      }
    } else if (text === '/refresh' || text.startsWith('/refresh ') || text === '/track' || text.startsWith('/track ')) {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "ℹ️ Please provide a tracking number.\nExample: <code>/refresh 62515161616</code>", replyKeyboard);
        return NextResponse.json({ ok: true });
      }
      const trackingNumber = parts[1].trim();
      const courier = parts[2]?.trim() || "Auto";

      await sendTelegramReply(chatId, `🔄 Fetching real-time status for <code>${trackingNumber}</code>...`, replyKeyboard);

      const { fetchLiveTrackingStatus } = await import("@/lib/tracking-service");
      const { getRefreshKeyboard } = await import("@/lib/telegram");
      
      const result = await fetchLiveTrackingStatus(trackingNumber, courier);
      const now = new Date().toLocaleString("en-US", { timeZone: "UTC" });
      const keyboard = getRefreshKeyboard(trackingNumber, courier);

      const { data: dbRows } = await supabaseAdmin
        .from('tracking_requests')
        .select('full_name, mobile_number, affiliate_id')
        .eq('tracking_number', trackingNumber)
        .order('created_at', { ascending: false })
        .limit(1);

      let isOwner = isAdmin;
      if (!isAdmin) {
        const { data: aff } = await supabaseAdmin
          .from('affiliate_links')
          .select('affiliate_id, is_active')
          .eq('chat_id', chatId)
          .single();
        if (aff?.affiliate_id && aff.is_active && dbRows?.[0]?.affiliate_id === aff.affiliate_id) {
          isOwner = true;
        }
      }

      const customerName = isOwner ? (dbRows?.[0]?.full_name || "N/A") : "🔒 [Protected/Hidden]";
      const customerPhone = isOwner ? (dbRows?.[0]?.mobile_number || "N/A") : "🔒 [Protected/Hidden]";

      if (result.success && result.data) {
        const data = result.data;
        let timelineText = "• No recent timeline entries right now.";
        if (data.timeline && data.timeline.length > 0) {
          timelineText = data.timeline
            .slice(0, 5)
            .map(e => `🔹 <b>${e.date ? e.date.split('T')[0] : ''} ${e.time || ''}</b>\n   └ ${e.description || 'Status update'}`)
            .join("\n\n");
        }
        const replyText = `⚡ <b>LIVE REFRESHED TRACKING STATUS</b> ⚡\n\n` +
          `👤 Customer Name: <b>${customerName}</b>\n` +
          `📱 Mobile Number: <code>${customerPhone}</code>\n` +
          `🔢 Tracking ID: <code>${trackingNumber}</code>\n` +
          `🚚 Courier: <b>${data.courier || courier}</b>\n` +
          `📊 Status: <b>${data.status_label}</b> (${data.progress || 0}%)\n` +
          `📍 Current Location: ${data.current_location || 'Transit'}\n\n` +
          `⏳ <b>Latest Recent Updates (Top 5):</b>\n${timelineText}\n\n` +
          `🕐 Refreshed At (UTC): ${now}`;
        await sendTelegramReply(chatId, replyText, keyboard);
      } else {
        const replyText = `❌ <b>Tracking Failed</b>\n\n👤 Customer: <b>${customerName}</b> (<code>${customerPhone}</code>)\n🔢 Tracking ID: <code>${trackingNumber}</code> (${courier})\nReason: ${result.error || "Courier server busy or tracking not found"}\n🕐 Checked At (UTC): ${now}`;
        await sendTelegramReply(chatId, replyText, keyboard);
      }
    } else if (text.startsWith('/export') || text === '📥 Export CSV' || text === '📄 Export TXT (A-Z)' || text === '📥 My Leads CSV' || text === '📄 My Leads TXT (A-Z)') {
      const { sendTelegramDocument } = await import("@/lib/telegram");
      let query = supabaseAdmin
        .from('tracking_requests')
        .select('tracking_number, courier_name, status, full_name, mobile_number, affiliate_id, created_at')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        const { data: aff } = await supabaseAdmin
          .from('affiliate_links')
          .select('affiliate_id, is_active')
          .eq('chat_id', chatId)
          .single();
        if (aff?.affiliate_id && aff.is_active) {
          query = query.eq('affiliate_id', aff.affiliate_id);
        } else {
          await sendTelegramReply(chatId, "❌ Access Denied: Only ACTIVE (approved) affiliates and Admin are allowed to export leads.", replyKeyboard);
          return NextResponse.json({ ok: true });
        }
      }

      const isTxtRequest = text.includes('TXT') || text.includes('text');
      await sendTelegramReply(chatId, `⏳ Generating ${isTxtRequest ? 'TXT (A-to-Z)' : 'CSV'} report from database...`, replyKeyboard);

      const { data: rows, error } = await query;
      if (error || !rows || rows.length === 0) {
        await sendTelegramReply(chatId, "❌ No tracking records found to export.", replyKeyboard);
        return NextResponse.json({ ok: true });
      }

      const { consolidateTrackingRows, generateLeadsSummaryTxt } = await import("@/lib/telegram");
      const consolidatedRows = consolidateTrackingRows(rows);

      if (!isTxtRequest || text.includes('CSV')) {
        const headers = ["Tracking Number", "Courier", "Status", "Full Name", "Mobile Number", "Total Search Attempts (Try Count)", "Affiliate ID", "Latest Searched At"];
        const csvRows = consolidatedRows.map(row => [
          `"${(row.tracking_number || '').replace(/"/g, '""')}"`,
          `"${(row.courier_name || '').replace(/"/g, '""')}"`,
          `"${(row.status || '').replace(/"/g, '""')}"`,
          `"${(row.full_name || '').replace(/"/g, '""')}"`,
          `"${(row.mobile_number || '').replace(/"/g, '""')}"`,
          `"${row.try_count || 1}"`,
          `"${(row.affiliate_id || 'Direct/System').replace(/"/g, '""')}"`,
          `"${(row.created_at || '').replace(/"/g, '""')}"`,
        ].join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const csvFilename = isAdmin ? `trackflow_all_tracking_export_${new Date().toISOString().slice(0, 10)}.csv` : `trackflow_my_leads_${new Date().toISOString().slice(0, 10)}.csv`;
        const title = isAdmin ? "📊 <b>All Platform Leads Data</b>" : "📊 <b>Your Affiliate Leads Data</b>";

        await sendTelegramDocument(
          chatId,
          csvFilename,
          csvContent,
          "text/csv",
          `${title} (CSV Format)\nTotal Consolidated Leads: <b>${consolidatedRows.length}</b> (Grouped from ${rows.length} total search attempts)`
        );
      }

      if (isTxtRequest || text === '/export') {
        const txtContent = generateLeadsSummaryTxt(consolidatedRows, isAdmin);
        const txtFilename = isAdmin ? `trackflow_all_leads_summary_${new Date().toISOString().slice(0, 10)}.txt` : `trackflow_my_leads_summary_${new Date().toISOString().slice(0, 10)}.txt`;
        const title = isAdmin ? "📊 <b>All Platform Leads Data</b>" : "📊 <b>Your Affiliate Leads Data</b>";

        await sendTelegramDocument(
          chatId,
          txtFilename,
          txtContent,
          "text/plain",
          `📄 <b>${title} (TXT Readable Format)</b>\nFormatted cleanly just like Telegram alerts so you can easily read & review all ${consolidatedRows.length} leads without Excel!`
        );
      }
    } else if (text.startsWith('/help')) {
        await sendTelegramReply(
          chatId,
          `ℹ️ <b>TrackFlow Bot Help</b>\n\nClick the buttons on your keyboard below to manage everything instantly without typing commands:\n• 📋 Pending Approvals\n• 👥 All Affiliates\n• 📥 Export CSV / 📄 Export TXT\n• 🔄 Audit Duplicates\n• 🌐 Web Admin Panel`,
          replyKeyboard
        );
    } else if (text === '❓ Support (@cozy_look)') {
      await sendTelegramReply(
        chatId,
        `📩 <b>Need Help?</b>\n\nFor subscription activation, ban appeals, or any questions, message the admin directly:\n👤 <b>@cozy_look</b>\n\nInclude your Chat ID: <code>${chatId}</code> so we can help you faster!`,
        replyKeyboard
      );
    } else {
      await sendTelegramReply(
        chatId,
        "Welcome to the TrackFlow bot. Use your bottom reply keyboard or tap /admin to open the button menu!",
        replyKeyboard
      );
    }

    // Always respond with 200 OK so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Still return 200 to Telegram
  }
}
