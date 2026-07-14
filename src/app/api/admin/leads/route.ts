import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const affiliateId = searchParams.get("affiliateId");

    let query = supabaseAdmin
      .from('tracking_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (affiliateId && affiliateId !== "all") {
      query = query.eq('affiliate_id', affiliateId);
    }

    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Also get quick stats
    const { count: totalCount } = await supabaseAdmin
      .from('tracking_requests')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      leads: leads || [],
      totalCount: totalCount || 0
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
