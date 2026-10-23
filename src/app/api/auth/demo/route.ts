import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { withStore } from "@/data/persist";

/** One-tap demo access with fictional data. Turn it off with DEMO_ACCESS=off before any real use. */
async function handlePOST() {
  if (process.env.DEMO_ACCESS === "off") return NextResponse.json({ error: "DISABLED" }, { status: 404 });
  const res = NextResponse.json({ next: "/dashboard" });
  res.cookies.set(SESSION_COOKIE, "demo-clinician", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

export const POST = withStore(handlePOST);
