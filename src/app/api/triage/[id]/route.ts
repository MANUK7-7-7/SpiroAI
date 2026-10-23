import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { attachRecording, getTriage, refer, scheduleRetriage, startMonitoring } from "@/data/repositories/triage";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("voice"), recordingId: z.string().min(1) }),
  z.object({ action: z.literal("refer"), slotId: z.string().min(1), worsening: z.boolean().optional() }),
  z.object({ action: z.literal("retriage") }),
  z.object({ action: z.literal("monitor") }),
]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const t = getTriage((await params).id);
  return t ? NextResponse.json({ voiceState: t.voiceState, priority: t.priority }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

/** Every step is a clinician action; the triage never books or closes a case on its own. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const id = (await params).id;
  const b = parsed.data;
  const out = b.action === "voice" ? attachRecording(id, b.recordingId)
    : b.action === "refer" ? refer(id, b.slotId, { worsening: b.worsening })
    : b.action === "retriage" ? scheduleRetriage(id)
    : startMonitoring(id);
  return out ? NextResponse.json({ ok: true, result: out }) : NextResponse.json({ error: "CONFLICT" }, { status: 409 });
}
