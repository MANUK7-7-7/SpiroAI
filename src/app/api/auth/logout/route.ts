import { NextResponse } from "next/server";
import { PRE_AUTH_COOKIE, SESSION_COOKIE } from "@/lib/session";
import { withStore } from "@/data/persist";

async function handlePOST() {
  const res = NextResponse.json({ next: "/login" });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(PRE_AUTH_COOKIE);
  return res;
}

export const POST = withStore(handlePOST);
