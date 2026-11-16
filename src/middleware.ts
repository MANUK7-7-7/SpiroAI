import { NextResponse, type NextRequest } from "next/server";
import { AGENT_SESSION, PRE_AUTH_COOKIE, SESSION_COOKIE } from "@/lib/session";

const protectedPrefixes = ["/agent", "/dashboard", "/patients", "/results", "/alerts", "/messages", "/monitoring", "/settings", "/triage", "/hospital", "/slip"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login/2fa" && !req.cookies.has(PRE_AUTH_COOKIE)) return NextResponse.redirect(new URL("/login", req.url));
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (protectedPrefixes.some(under) && !session) return NextResponse.redirect(new URL("/login", req.url));
  // The health-agent demo lives in its own phone view, and only there.
  if (under("/agent") && session !== AGENT_SESSION) return NextResponse.redirect(new URL("/", req.url));
  if (session === AGENT_SESSION && protectedPrefixes.some(under) && !under("/agent") && !under("/slip")) return NextResponse.redirect(new URL("/agent", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|assets|.*\\..*).*)"] };
