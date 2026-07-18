import { NextRequest, NextResponse } from "next/server";
import { signJwtToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { passphrase, action } = await req.json();

    if (action === "logout") {
      const response = NextResponse.json({ ok: true, message: "Logged out" });
      response.cookies.delete("admin_token");
      return response;
    }

    const adminChatId = process.env.TELEGRAM_CHAT_ID || "7339733475"; // Default fallback to known admin ID or env
    const masterPass = process.env.ADMIN_PASSPHRASE || "cozy_look";

    // Allow entry if passphrase matches TELEGRAM_CHAT_ID or master passphrase or 'admin' for easy entry by owner
    if (
      passphrase === adminChatId ||
      passphrase.toLowerCase() === masterPass.toLowerCase() ||
      passphrase.toLowerCase() === "admin" ||
      passphrase === "7339733475"
    ) {
      // Create Military-Grade JWT token
      const token = await signJwtToken({ isAdmin: true, username: "cozy_look" });

      const response = NextResponse.json({ ok: true, message: "Welcome Admin @cozy_look!" });
      
      // Set secure HTTP-only cookie
      response.cookies.set({
        name: "admin_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ ok: false, error: "Invalid Admin Passphrase or Chat ID" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

