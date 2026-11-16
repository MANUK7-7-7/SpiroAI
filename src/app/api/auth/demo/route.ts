import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { withStore } from "@/data/persist";
import { AGENT_SESSION } from "@/data/fixtures/agent";

const DOCTOR_PAGES = ["/dashboard", "/alerts", "/triage"];

/**
 * One-tap demo access with fictional data. Turn it off with DEMO_ACCESS=off before any real use.
 * `role: "agent"` opens the phone view of a health agent on home visits; anything else opens the doctor's workspace.
 */
async function handlePOST(req: Request) {
  if (process.env.DEMO_ACCESS === "off") return NextResponse.json({ error: "DISABLED" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { role?: string; next?: string };
  const agent = body.role === "agent";
  const next = agent ? "/agent" : DOCTOR_PAGES.includes(body.next ?? "") ? body.next! : "/dashboard";
  const res = NextResponse.json({ next });
  res.cookies.set(SESSION_COOKIE, agent ? AGENT_SESSION : "demo-clinician", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

export const POST = withStore(handlePOST);
