import { NextResponse } from "next/server";
import { hasSession } from "@/lib/api-auth";
import { authorize, complete } from "@/data/repositories/recordings";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = authorize((await params).id, req.headers.get("x-recording-secret"), hasSession(req));
  if (!s) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const out = complete(s);
  return "error" in out ? NextResponse.json(out, { status: 422 }) : NextResponse.json({ status: "processing" }, { status: 202 });
}
