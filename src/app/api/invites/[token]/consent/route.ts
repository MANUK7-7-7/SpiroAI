import { NextResponse } from "next/server";
import { acceptConsent } from "@/data/repositories/recordings";
import { withStore } from "@/data/persist";

async function handlePOST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const inv = acceptConsent((await params).token);
  return inv ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
}

export const POST = withStore(handlePOST);
