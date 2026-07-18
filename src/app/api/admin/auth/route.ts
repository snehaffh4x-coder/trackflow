import { NextRequest, NextResponse } from "next/server";
import { signJwtToken, verifyJwtToken } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTelegramReply } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const { action, chatId, otpCode } = await req.json();

    if (action === "logout") {
      const response = NextResponse.json({ ok: true, message: "Logged out" });
      response.cookies.delete("admin_token");
      response.cookies.delete("otp_token");
      return response;
    }

    if (!chatId) {
      return NextResponse.json({ ok: false, error: "Chat ID is required" }, { status: 400 });
    }

    const adminChatId = process.env.TELEGRAM_CHAT_ID;
    const isAdmin = chatId === adminChatId;

    if (action === "request_otp") {
      // Verify user exists, is active (approved) and not banned
      const { data: user, error } = await supabaseAdmin
        .from('affiliate_links')
        .select('is_active, is_banned')
        .eq('chat_id', chatId)
        .single();

      if (error || !user) {
        return NextResponse.json({ ok: false, error: "Invalid Chat ID or Affiliate not found" }, { status: 401 });
      }
      
      if (!user.is_active || user.is_banned) {
        return NextResponse.json({ ok: false, error: "Account is not approved or is banned" }, { status: 403 });
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Sign temporary OTP token (valid for 5 mins)
      const otpToken = await signJwtToken({ chatId, otpCode: generatedOtp, type: "otp" });
      
      // Send OTP via Telegram
      await sendTelegramReply(chatId, `🔐 <b>Login Attempt</b>\n\nYour One-Time Password is: <code>${generatedOtp}</code>\n\n<i>This code will expire in 5 minutes. Do not share it with anyone.</i>`, {
        inline_keyboard: [[{ text: "🌐 TrackFlow", url: "https://t.me/" }]] // generic keyboard or empty
      });

      const response = NextResponse.json({ ok: true, message: "OTP sent to your Telegram" });
      response.cookies.set({
        name: "otp_token",
        value: otpToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60, // 5 minutes
        path: "/",
      });

      return response;
    }

    if (action === "verify_otp") {
      if (!otpCode) {
        return NextResponse.json({ ok: false, error: "OTP is required" }, { status: 400 });
      }

      const otpToken = req.cookies.get("otp_token")?.value;
      if (!otpToken) {
        return NextResponse.json({ ok: false, error: "OTP Expired or Invalid Session" }, { status: 400 });
      }

      const payload = await verifyJwtToken(otpToken);
      if (!payload || payload.type !== "otp" || payload.chatId !== chatId || payload.otpCode !== otpCode) {
        return NextResponse.json({ ok: false, error: "Invalid or Expired OTP" }, { status: 401 });
      }

      // Re-verify user to get metadata
      const { data: user, error } = await supabaseAdmin
        .from('affiliate_links')
        .select('affiliate_id, telegram_username, is_active, is_banned')
        .eq('chat_id', chatId)
        .single();

      if (error || !user || !user.is_active || user.is_banned) {
        return NextResponse.json({ ok: false, error: "Account is no longer approved" }, { status: 403 });
      }

      // Issue final JWT
      const token = await signJwtToken({ 
        isAdmin, 
        username: user.telegram_username || "user",
        affiliateId: user.affiliate_id,
        chatId: chatId
      });

      const response = NextResponse.json({ 
        ok: true, 
        message: `Welcome ${isAdmin ? 'Admin' : 'Affiliate'} @${user.telegram_username || 'user'}!`,
        isAdmin,
        redirectUrl: isAdmin ? "/admin" : "/affiliate"
      });
      
      response.cookies.set({
        name: "admin_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
      
      response.cookies.delete("otp_token");

      return response;
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

