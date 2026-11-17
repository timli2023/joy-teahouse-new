
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = supabaseAdmin();

    const { data: orders, error } = await db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const orderIds = (orders ?? []).map((order) => order.id);

    let items: any[] = [];

    if (orderIds.length > 0) {
      const { data, error: itemsError } = await db
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;
      items = data ?? [];
    }

    const result = (orders ?? []).map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    }));

    return NextResponse.json({ orders: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取订单失败" },
      { status: 500 }
    );
  }
}
