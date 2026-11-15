import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("products").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not load menu" }, { status: 500 });
  }
}
