import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_OTP, PRE_AUTH_COOKIE, SESSION_COOKIE } from "@/lib/session";
import { withStore } from "@/data/persist";

const body = z.object({ code: z.string().regex(/^\d{6}$/), trustDevice: z.boolean().optional() });

async function handlePOST(req: Request) {
  const pre = req.headers.get("cookie")?.includes(`${PRE_AUTH_COOKIE}=1`);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!pre || !parsed.success || parsed.data.code !== DEMO_OTP) return NextResponse.json({ error: "INVALID_CODE" }, { status: 401 });
  const res = NextResponse.json({ next: "/dashboard" });
  res.cookies.set(SESSION_COOKIE, "demo-clinician", { httpOnly: true, sameSite: "lax", path: "/", maxAge: parsed.data.trustDevice ? 60 * 60 * 24 * 30 : undefined });
  res.cookies.delete(PRE_AUTH_COOKIE);
  return res;
}

export const POST = withStore(handlePOST);
