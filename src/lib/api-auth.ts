import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "./session";

export const hasSession = (req: Request) => (req.headers.get("cookie") ?? "").split(/;\s*/).some((c) => c.startsWith(`${SESSION_COOKIE}=`));
export const unauthorized = () => NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
