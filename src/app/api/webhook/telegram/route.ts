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

    // 2. Verify this is a message
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

    } else if (text.startsWith('/help')) {
        await sendTelegramReply(
          chatId,
          `ℹ️ <b>TrackFlow Bot Help</b>\n\nCommands you can use:\n/start - Register and get your promotion link\n/link - View your promotion link again\n/help - Show this message\n\n<i>When users visit your link and track a package, the details will be sent directly to you here!</i>`
        );
    } else {
      // Unknown command
      await sendTelegramReply(
        chatId,
        "Welcome to the TrackFlow bot. Please send /start to generate your unique tracking link, or /help for more info."
      );
    }

    // Always respond with 200 OK so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Still return 200 to Telegram
  }
}
