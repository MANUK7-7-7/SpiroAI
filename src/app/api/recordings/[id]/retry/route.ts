import { after, NextResponse } from "next/server";
import { persistStore } from "@/data/persist";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { startScreening } from "@/data/repositories/screening";
import { store } from "@/data/store";
import { withStore } from "@/data/persist";

/** Re-runs analysis on the stored audio after a failure. Creates a new result; the old one is kept. */
async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const s = store.recordings.get((await params).id);
  const prev = store.liveRecords.find((r) => r.result.recordingId === s?.id)?.result;
  if (!s || !prev || prev.status !== "failed" || !prev.error?.retryable) return NextResponse.json({ error: "NOT_RETRYABLE" }, { status: 409 });
  const job = startScreening(s.id, { retryOf: prev.id });
  after(async () => { await job; await persistStore(); });
  return NextResponse.json({ status: "processing" }, { status: 202 });
}

export const POST = withStore(handlePOST);
