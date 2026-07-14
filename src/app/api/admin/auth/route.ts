import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { passphrase } = await req.json();
    const adminChatId = process.env.TELEGRAM_CHAT_ID || "7339733475"; // Default fallback to known admin ID or env
    const masterPass = process.env.ADMIN_PASSPHRASE || "cozy_look";

    // Allow entry if passphrase matches TELEGRAM_CHAT_ID or master passphrase or 'admin' for easy entry by owner
    if (
      passphrase === adminChatId ||
      passphrase.toLowerCase() === masterPass.toLowerCase() ||
      passphrase.toLowerCase() === "admin" ||
      passphrase === "7339733475"
    ) {
      return NextResponse.json({ ok: true, message: "Welcome Admin @cozy_look!" });
    }

    return NextResponse.json({ ok: false, error: "Invalid Admin Passphrase or Chat ID" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
