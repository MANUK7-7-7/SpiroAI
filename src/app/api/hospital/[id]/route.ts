import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { enterSpirometry } from "@/data/repositories/triage";
import { withStore } from "@/data/persist";

const body = z.discriminatedUnion("status", [
  z.object({ status: z.literal("done"), ratio: z.number().min(0.2).max(1.2) }),
  z.object({ status: z.literal("no_show") }),
]);

async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const out = enterSpirometry((await params).id, parsed.data, "Téc. L. Funes");
  return out ? NextResponse.json({ spirometry: out }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export const POST = withStore(handlePOST);
