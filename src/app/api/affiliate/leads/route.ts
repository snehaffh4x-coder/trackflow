import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyJwtToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwtToken(token);
    if (!payload || payload.isAdmin) {
      // If it's an admin token, they shouldn't be using this route, or we can allow it
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: leads, error } = await supabaseAdmin
      .from("tracking_requests")
      .select("*")
      .eq("affiliate_id", payload.affiliateId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, leads, totalCount: leads.length });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
