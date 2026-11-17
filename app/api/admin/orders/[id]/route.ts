
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";

const allowedStatuses = ["new", "preparing", "completed"];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: "请先登录管理员账户" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const status = body.status;

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "无效的订单状态" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新订单失败" },
      { status: 500 }
    );
  }
}
