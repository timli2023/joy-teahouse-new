import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Line = { productId: string; quantity: number; size?: "small" | "large"; temperature?: "iced" | "hot"; sweetness?: "10%" | "30%" | "50%" | "70%" | "100%" };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lines = body.items as Line[];
    const diningType = body.diningType as "dine_in" | "takeaway";
    const tableNumber = body.tableNumber ? Number(body.tableNumber) : null;
    if (!Array.isArray(lines) || lines.length === 0) return NextResponse.json({ error: "购物车是空的" }, { status: 400 });
    if (!["dine_in", "takeaway"].includes(diningType)) return NextResponse.json({ error: "请选择用餐方式" }, { status: 400 });
    if (diningType === "dine_in" && (!tableNumber || tableNumber < 1 || tableNumber > 10)) return NextResponse.json({ error: "请选择1–10号桌" }, { status: 400 });

    const db = supabaseAdmin();
    const ids = [...new Set(lines.map(x => x.productId))];
    const { data: products, error: productError } = await db.from("products").select("*").in("id", ids).eq("is_active", true);
    if (productError) throw productError;
    if (!products || products.length !== ids.length) return NextResponse.json({ error: "有商品已下架，请刷新菜单" }, { status: 400 });

    let subtotal = 0;
    let containsFood = false;
    const rows = [];
    for (const line of lines) {
      const p = products.find(x => x.id === line.productId);
      const qty = Math.floor(Number(line.quantity));
      if (!p || !Number.isFinite(qty) || qty < 1 || qty > 50) return NextResponse.json({ error: "商品数量无效" }, { status: 400 });
      let unitPrice = Number(p.price);
      const options: Record<string, string> = {};
      if (p.is_drink) {
        if (!["small", "large"].includes(line.size ?? "") || !["iced", "hot"].includes(line.temperature ?? "") || !["10%", "30%", "50%", "70%", "100%"].includes(line.sweetness ?? "")) {
          return NextResponse.json({ error: `请完整选择${p.name_zh}的杯型、冷热和甜度` }, { status: 400 });
        }
        const sizes = p.size_prices as { small: number; large: number };
        unitPrice = Number(sizes[line.size!]);
        options.size = line.size!;
        options.temperature = line.temperature!;
        options.sweetness = line.sweetness!;
      }
      if (p.category === "food" || p.category === "rice" || p.category === "snack") containsFood = true;
      subtotal += unitPrice * qty;
      rows.push({
        product_id: p.id, product_name_zh: p.name_zh, quantity: qty,
        unit_price: unitPrice, line_total: unitPrice * qty, options
      });
    }
    const packagingFee = diningType === "takeaway" && containsFood ? 0.25 : 0;
    const total = Number((subtotal + packagingFee).toFixed(2));
    const orderNo = `J${Date.now().toString().slice(-8)}`;
   const phone = String(body.phone ?? "").trim();

if (!/^\+?[0-9]{9,15}$/.test(phone)) {
  return NextResponse.json(
    { error: "请输入正确的手机号码" },
    { status: 400 }
  );
}
    const { data: order, error: orderError } = await db.from("orders").insert({
      order_number: orderNo, dining_type: diningType, table_number: diningType === "dine_in" ? tableNumber : null,
      phone,
      subtotal: Number(subtotal.toFixed(2)), packaging_fee: packagingFee, total, status: "new"
    }).select().single();
    if (orderError) throw orderError;
    const itemRows = rows.map(r => ({ ...r, order_id: order.id }));
    const { error: itemsError } = await db.from("order_items").insert(itemRows);
    if (itemsError) {
      await db.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }
    return NextResponse.json({ success: true, orderNumber: orderNo, total, packagingFee });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "提交订单失败" }, { status: 500 });
  }
}
