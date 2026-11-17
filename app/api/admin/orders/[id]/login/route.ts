
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const adminPin = process.env.ADMIN_PIN;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (!adminPin || !sessionSecret) {
      return NextResponse.json(
        { error: "服务器尚未配置管理员登录信息" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const pin = String(body.pin ?? "");

    const supplied = Buffer.from(pin);
    const expected = Buffer.from(adminPin);

    const valid =
      supplied.length === expected.length &&
      timingSafeEqual(supplied, expected);

    if (!valid) {
      return NextResponse.json(
        { error: "PIN 不正确" },
        { status: 401 }
      );
    }

    const token = createAdminToken();

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
