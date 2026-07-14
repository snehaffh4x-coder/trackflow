import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramReply } from '@/lib/telegram';
import { nanoid } from 'nanoid';

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
      
      if (BOT_TOKEN && callbackQueryId) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: "🔄 Fetching live status right now..."
          })
        }).catch(console.error);
      }

      if (callbackData.startsWith("ref_")) {
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

          const customerName = dbRows?.[0]?.full_name || "N/A";
          const customerPhone = dbRows?.[0]?.mobile_number || "N/A";

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
        const parts = callbackData.split("_");
        const trackingNumber = parts[1];
        const courier = parts.slice(2).join("_") || "Auto";

        if (trackingNumber) {
          const { fetchLiveTrackingStatus } = await import("@/lib/tracking-service");
          const { sendTelegramDocument } = await import("@/lib/telegram");
          const result = await fetchLiveTrackingStatus(trackingNumber, courier);

          const { data: dbRows } = await supabaseAdmin
            .from('tracking_requests')
            .select('full_name, mobile_number, affiliate_id, created_at')
            .eq('tracking_number', trackingNumber)
            .order('created_at', { ascending: false })
            .limit(1);

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
        const { sendTelegramDocument } = await import("@/lib/telegram");
        const isAdmin = chatId === process.env.TELEGRAM_CHAT_ID;
        let query = supabaseAdmin
          .from('tracking_requests')
          .select('tracking_number, courier_name, status, full_name, mobile_number, affiliate_id, created_at')
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          const { data: aff } = await supabaseAdmin
            .from('affiliate_links')
            .select('affiliate_id')
            .eq('chat_id', chatId)
            .single();
          if (aff?.affiliate_id) {
            query = query.eq('affiliate_id', aff.affiliate_id);
          } else {
            await sendTelegramReply(chatId, "❌ Export is only permitted for registered affiliates and Admin.");
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

    // 3. Handle commands
    if (text.startsWith('/start') || text.startsWith('/link')) {
      // Check if user already has an affiliate link
      const { data: existing } = await supabaseAdmin
        .from('affiliate_links')
        .select('affiliate_id, is_active')
        .eq('chat_id', chatId)
        .single();

      let affiliateId = "";
      let isActive = false;

      if (existing) {
        affiliateId = existing.affiliate_id;
        isActive = existing.is_active;
        // Optionally update their username if it changed
        await supabaseAdmin.from('affiliate_links').update({ telegram_username: senderUsername }).eq('chat_id', chatId);
      } else {
        // Advanced Security: Prevent ANY chance of duplicate affiliate_id collision
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 5) {
          affiliateId = nanoid(8);
          const { data: duplicateCheck } = await supabaseAdmin.from('affiliate_links').select('id').eq('affiliate_id', affiliateId).single();
          if (!duplicateCheck) {
            isUnique = true;
          }
          attempts++;
        }
        
        // Save to Supabase (is_active will default to false via DB schema)
        const { error } = await supabaseAdmin
          .from('affiliate_links')
          .insert([{ chat_id: chatId, affiliate_id: affiliateId, telegram_username: senderUsername }]);

        if (error) {
          console.error("Failed to insert affiliate link:", error);
          await sendTelegramReply(chatId, "❌ Sorry, there was an error generating your link. Please try again later.");
          return NextResponse.json({ ok: true });
        }
      }

      if (isActive) {
        await sendTelegramReply(
          chatId,
          `👋 Welcome back! Your promotion link is active.\n\n🔗 <b>Your Link:</b>\n<code>${DOMAIN}/?ref=${affiliateId}</code>\n\nShare this link to start receiving tracking data directly here!`
        );
      } else {
        await sendTelegramReply(
          chatId,
          `⚠️ <b>Your Link is INACTIVE</b>\n\nWe've generated a unique tracking link for you, but you need a subscription to activate it.\n\n🔗 <b>Your Link:</b>\n<code>${DOMAIN}/?ref=${affiliateId}</code>\n\n<b>How to activate:</b>\nMessage <b>@cozy_look</b> to purchase a subscription.\nSend them your Chat ID: <code>${chatId}</code>\nYour Username: <code>@${senderUsername}</code>`
        );
      }
    } else if (text.startsWith('/approve')) {
      // Admin only command
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      
      // Strict verification: Must match BOTH the environment chat ID AND the cozy_look username
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
        .update({ is_active: true })
        .eq('chat_id', targetChatId)
        .select()
        .single();

      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to approve. Chat ID ${targetChatId} not found.`);
      } else {
        await sendTelegramReply(chatId, `✅ Successfully approved Chat ID ${targetChatId}!`);
        // Notify the user
        await sendTelegramReply(targetChatId, `🎉 <b>Congratulations!</b>\n\nYour subscription is now <b>ACTIVE</b>.\nAny tracking data from your link will now be sent directly to you here!`);
      }

    } else if (text.startsWith('/reject')) {
      // Admin only command
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
        .delete()
        .eq('chat_id', targetChatId)
        .select()
        .single();

      if (error || !data) {
        await sendTelegramReply(chatId, `❌ Failed to reject. Chat ID ${targetChatId} not found or already deleted.`);
      } else {
        await sendTelegramReply(chatId, `🗑️ Successfully rejected and deleted Chat ID ${targetChatId}!`);
        // Notify the user
        await sendTelegramReply(targetChatId, `❌ <b>Request Rejected</b>\n\nYour subscription request was rejected. If you think this is a mistake, please contact @cozy_look.`);
      }

    } else if (text.startsWith('/pending')) {
      // Admin only command
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      
      if (chatId !== adminChatId || senderUsername.toLowerCase() !== 'cozy_look') {
        await sendTelegramReply(chatId, "❌ You do not have permission to use this command.");
        return NextResponse.json({ ok: true });
      }

      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .select('chat_id, telegram_username, created_at')
        .eq('is_active', false)
        .order('created_at', { ascending: false });

      if (error) {
        await sendTelegramReply(chatId, "❌ Error fetching pending requests.");
        return NextResponse.json({ ok: true });
      }

      if (!data || data.length === 0) {
        await sendTelegramReply(chatId, "✅ No pending approval requests.");
      } else {
        let msg = "📋 <b>Pending Approvals:</b>\n\n";
        data.forEach((req, index) => {
          msg += `${index + 1}. @${req.telegram_username || 'unknown'} - <code>${req.chat_id}</code>\n`;
        });
        msg += "\nTo approve, copy the ID and use:\n<code>/approve CHAT_ID</code>";
        
        await sendTelegramReply(chatId, msg);
      }

    } else if (text.startsWith('/refresh') || text.startsWith('/track')) {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) {
        await sendTelegramReply(chatId, "ℹ️ Please provide a tracking number.\nExample: <code>/refresh 62515161616</code>");
        return NextResponse.json({ ok: true });
      }
      const trackingNumber = parts[1].trim();
      const courier = parts[2]?.trim() || "Auto";

      await sendTelegramReply(chatId, `🔄 Fetching real-time status for <code>${trackingNumber}</code>...`);

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

      const customerName = dbRows?.[0]?.full_name || "N/A";
      const customerPhone = dbRows?.[0]?.mobile_number || "N/A";

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
    } else if (text.startsWith('/export')) {
      const { sendTelegramDocument } = await import("@/lib/telegram");
      const isAdmin = chatId === process.env.TELEGRAM_CHAT_ID;
      let query = supabaseAdmin
        .from('tracking_requests')
        .select('tracking_number, courier_name, status, full_name, mobile_number, affiliate_id, created_at')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        const { data: aff } = await supabaseAdmin
          .from('affiliate_links')
          .select('affiliate_id')
          .eq('chat_id', chatId)
          .single();
        if (aff?.affiliate_id) {
          query = query.eq('affiliate_id', aff.affiliate_id);
        } else {
          await sendTelegramReply(chatId, "❌ /export command is only available for registered affiliates and Admin.");
          return NextResponse.json({ ok: true });
        }
      }

      await sendTelegramReply(chatId, "⏳ Generating CSV export dataset directly from database...");

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
    } else if (text.startsWith('/help')) {
        await sendTelegramReply(
          chatId,
          `ℹ️ <b>TrackFlow Bot Help</b>\n\nCommands you can use:\n/start - Register and get your promotion link\n/link - View your promotion link again\n/refresh &lt;tracking_no&gt; - Live refresh any tracking number\n/track &lt;tracking_no&gt; - Live track any package\n/export - Export all your tracking data to CSV right here\n/help - Show this message\n\n<i>You can also click the buttons on any tracking alert!</i>`
        );
    } else {
      // Unknown command
      await sendTelegramReply(
        chatId,
        "Welcome to the TrackFlow bot. Send /start to generate your unique tracking link, or /refresh <tracking_number> to check live status."
      );
    }

    // Always respond with 200 OK so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Still return 200 to Telegram
  }
}
