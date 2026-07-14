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

export async function sendTelegramDocument(
  chatId: number | string,
  filename: string,
  content: string,
  contentType: string = "text/csv",
  caption?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
    }

    const blob = new Blob([content], { type: contentType });
    formData.append("document", blob, filename);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data: TelegramResponse = await response.json();
    if (!data.ok) {
      console.error("[Telegram] Failed to send document:", data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Telegram] Error sending document:", error);
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
          text: "🔄 Live Refresh Status",
          callback_data: `ref_${trackingNumber}_${safeCourier}`
        },
        {
          text: "📄 Export Package History",
          callback_data: `pkgexp_${trackingNumber}_${safeCourier}`
        }
      ],
      [
        {
          text: "📊 Export All Tracking Data (CSV)",
          callback_data: "export_all_csv"
        }
      ]
    ]
  };
}

export interface ConsolidatedRow {
  tracking_number: string;
  courier_name: string;
  status: string;
  full_name: string;
  mobile_number: string;
  try_count: number;
  affiliate_id: string;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function consolidateTrackingRows(rows: any[]): ConsolidatedRow[] {
  const groupedMap = new Map<string, ConsolidatedRow>();

  rows.forEach(row => {
    const tNum = (row.tracking_number || '').trim().toLowerCase();
    const mNum = (row.mobile_number || '').trim();
    const key = `${tNum}_${mNum}`;

    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key)!;
      existing.try_count += 1;
      if (row.created_at && (!existing.created_at || new Date(row.created_at) > new Date(existing.created_at))) {
        existing.created_at = row.created_at;
        existing.status = row.status || existing.status;
        existing.courier_name = row.courier_name || existing.courier_name;
        existing.full_name = row.full_name || existing.full_name;
      }
    } else {
      groupedMap.set(key, {
        tracking_number: row.tracking_number || '',
        courier_name: row.courier_name || '',
        status: row.status || '',
        full_name: row.full_name || '',
        mobile_number: row.mobile_number || '',
        try_count: 1,
        affiliate_id: row.affiliate_id || 'Direct/System',
        created_at: row.created_at || ''
      });
    }
  });

  return Array.from(groupedMap.values()).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

