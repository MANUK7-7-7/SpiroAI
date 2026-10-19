import { NextResponse } from "next/server";
import { z } from "zod";
import { PRE_AUTH_COOKIE } from "@/lib/session";

const body = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  const res = NextResponse.json({ next: "/login/2fa" });
  res.cookies.set(PRE_AUTH_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
