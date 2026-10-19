import { NextResponse } from "next/server";
import { PRE_AUTH_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ next: "/login" });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PRE_AUTH_COOKIE);
  return res;
}
