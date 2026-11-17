
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "joy_admin_session";

export { COOKIE_NAME };

export function createAdminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET missing");

  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })
  ).toString("base64url");

  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyAdminToken(token?: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest();

  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
