import { NextResponse, type NextRequest } from "next/server";
import { PRE_AUTH_COOKIE, SESSION_COOKIE } from "@/lib/session";

const protectedPrefixes = ["/dashboard", "/patients", "/results", "/alerts", "/messages", "/monitoring", "/settings", "/triage", "/hospital", "/slip"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login/2fa" && !req.cookies.has(PRE_AUTH_COOKIE)) return NextResponse.redirect(new URL("/login", req.url));
  if (protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !req.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|assets|.*\\..*).*)"] };
