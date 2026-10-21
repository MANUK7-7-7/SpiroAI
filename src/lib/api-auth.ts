import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "./session";

export const hasSession = (req: Request) => (req.headers.get("cookie") ?? "").split(/;\s*/).some((c) => c.startsWith(`${SESSION_COOKIE}=`));
export const unauthorized = () => NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

/**
 * The inference service fetches audio through the same short-lived signed URLs, without a clinician
 * session. It proves who it is with the shared AI_API_KEY. In local development, with no key set,
 * the signature alone is accepted.
 */
export const isModelService = (req: Request) => {
  const key = process.env.AI_API_KEY;
  return !key || req.headers.get("authorization") === `Bearer ${key}`;
};
