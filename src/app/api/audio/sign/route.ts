import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { signPath } from "@/lib/signed-url";
import { audioTaskIdSchema } from "@/ai/contracts";

const body = z.object({ recordingId: z.string().min(1), task: audioTaskIdSchema });

/** Mints a fresh short-lived URL when the one rendered with the page has expired. */
export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  return NextResponse.json({ url: signPath(`/api/audio/${parsed.data.recordingId}/${parsed.data.task}`) });
}
