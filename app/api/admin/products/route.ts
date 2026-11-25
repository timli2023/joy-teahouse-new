
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: "请先登录管理员账户" },
        { status: 401 }
      );
    }

    const db = supabaseAdmin();

    const { data, error } = await db
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "读取产品失败",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { error: "请先登录管理员账户" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const productId = String(body.productId ?? "");
    const isActive = body.isActive;

    if (!productId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "产品信息无效" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    const { error } = await db
      .from("products")
      .update({ is_active: isActive })
      .eq("id", productId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新产品失败",
      },
      { status: 500 }
    );
  }
}
