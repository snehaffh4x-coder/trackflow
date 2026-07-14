import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramReply } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  try {
    const { data: affiliates, error } = await supabaseAdmin
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Also fetch counts of tracking requests per affiliate
    const { data: leadCounts } = await supabaseAdmin
      .from('tracking_requests')
      .select('affiliate_id');

    const countsMap: Record<string, number> = {};
    if (leadCounts) {
      for (const row of leadCounts) {
        if (row.affiliate_id) {
          countsMap[row.affiliate_id] = (countsMap[row.affiliate_id] || 0) + 1;
        }
      }
    }

    const enrichedAffiliates = (affiliates || []).map(aff => ({
      ...aff,
      leadsCount: countsMap[aff.affiliate_id] || 0
    }));

    return NextResponse.json({ ok: true, affiliates: enrichedAffiliates });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, chatId, reason } = body;

    if (action === "clean_duplicates") {
      // Find all rows grouped by chat_id or affiliate_id and keep only the latest one
      const { data: allRows } = await supabaseAdmin
        .from('affiliate_links')
        .select('id, chat_id, affiliate_id, created_at')
        .order('created_at', { ascending: false });

      if (!allRows) return NextResponse.json({ ok: true, removed: 0 });

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
      }

      return NextResponse.json({ ok: true, removed: idsToDelete.length, message: `Cleaned ${idsToDelete.length} duplicate entries.` });
    }

    if (!chatId) {
      return NextResponse.json({ ok: false, error: "Chat ID is required" }, { status: 400 });
    }

    let updateData: any = {};
    let notificationText = "";

    if (action === "approve") {
      updateData = { is_active: true, is_banned: false, ban_reason: null };
      notificationText = `🎉 <b>Congratulations!</b>\n\nYour affiliate link has been approved and is now <b>ACTIVE</b>!`;
    } else if (action === "suspend") {
      updateData = { is_active: false };
      notificationText = `⚠️ <b>Link Suspended</b>\n\nYour affiliate link has been temporarily suspended by Admin.`;
    } else if (action === "ban") {
      updateData = { is_banned: true, is_active: false, ban_reason: reason || "Admin action: Violation of terms" };
      notificationText = `🚫 <b>Account Banned</b>\n\nYour promotional link has been banned due to: <i>${reason || "Violation of terms"}</i>. Contact @cozy_look if you believe this is a mistake.`;
    } else if (action === "unban") {
      updateData = { is_banned: false, ban_reason: null };
      notificationText = `♻️ <b>Account Restored</b>\n\nYour ban has been lifted by Admin. You can now access your link and stats.`;
    } else if (action === "delete") {
      const { error } = await supabaseAdmin.from('affiliate_links').delete().eq('chat_id', chatId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, message: `Deleted affiliate ${chatId}` });
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliate_links')
      .update(updateData)
      .eq('chat_id', chatId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message || "Affiliate not found" }, { status: 500 });
    }

    if (notificationText) {
      await sendTelegramReply(chatId, notificationText).catch(console.error);
    }

    return NextResponse.json({ ok: true, affiliate: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
