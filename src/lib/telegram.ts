// ============================================
// TrackFlow — Telegram Bot Helper
// ============================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

export async function sendTelegramMessage(text: string, replyMarkup?: unknown): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured, skipping notification");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error("[Telegram] Failed to send message:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] Error sending message:", error);
    return false;
  }
}

export async function sendTelegramReply(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const data: TelegramResponse = await response.json();
    return data.ok;
  } catch (error) {
    console.error("[Telegram] Error sending reply:", error);
    return false;
  }
}

export function formatTrackingNotification(
  trackingNumber: string,
  courier: string,
  status: string,
  fullName: string,
  mobileNumber: string
): string {
  const now = new Date().toLocaleString("en-US", { timeZone: "UTC" });
  return `📦 <b>New Tracking Search</b>\n\n👤 Name: ${fullName}\n📱 Mobile: <code>${mobileNumber}</code>\n🔢 Tracking ID: <code>${trackingNumber}</code>\n🚚 Courier: ${courier || "Auto-detect"}\n📊 Status: <b>${status}</b>\n🕐 Time (UTC): ${now}`;
}

export function getRefreshKeyboard(trackingNumber: string, courier: string) {
  const safeCourier = (courier || "Auto").substring(0, 20);
  return {
    inline_keyboard: [
      [
        {
          text: "🔄 Refresh Status (Realtime)",
          callback_data: `ref_${trackingNumber}_${safeCourier}`
        }
      ]
    ]
  };
}
