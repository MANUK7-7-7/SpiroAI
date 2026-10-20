import { NextResponse } from "next/server";
import { hasSession, isModelService, unauthorized } from "@/lib/api-auth";
import { demoWav } from "@/lib/demo-audio";
import { verifyPath } from "@/lib/signed-url";
import { recordAudit, store } from "@/data/store";
import { audioTaskIdSchema } from "@/ai/contracts";

export async function GET(req: Request, { params }: { params: Promise<{ recordingId: string; task: string }> }) {
  const { recordingId, task } = await params;
  const parsed = audioTaskIdSchema.safeParse(task);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const url = new URL(req.url);
  if (!(hasSession(req) || isModelService(req)) || !verifyPath(`/api/audio/${recordingId}/${task}`, url.searchParams.get("exp"), url.searchParams.get("sig"))) return unauthorized();
  recordAudit({ action: "audio.read", subject: recordingId, detail: task });
  const real = store.recordings.get(recordingId)?.completed[parsed.data];
  if (real) return new NextResponse(new Uint8Array(real), { headers: { "content-type": "audio/wav", "cache-control": "private, no-store", "accept-ranges": "none" } });
  const body = demoWav(parsed.data, { sustained_vowel: 16, counting: 10, cough: 4 }[parsed.data]);
  return new NextResponse(new Uint8Array(body), { headers: { "content-type": "audio/wav", "cache-control": "private, no-store", "accept-ranges": "none" } });
}
