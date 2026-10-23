import { NextResponse } from "next/server";
import { hasSession } from "@/lib/api-auth";
import { authorize } from "@/data/repositories/recordings";
import { store } from "@/data/store";
import { withStore } from "@/data/persist";

/**
 * Polled by the recorder. The patient link only ever learns "received" or "repeat":
 * a score is never shown to a patient. Clinicians also get the result id.
 */
async function handleGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const clinician = hasSession(req);
  const s = authorize((await params).id, req.headers.get("x-recording-secret"), clinician);
  if (!s) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const rec = store.liveRecords.find((r) => r.result.recordingId === s.id)?.result;
  const outcome = !rec ? "processing" : rec.status === "ready" ? "received" : rec.status === "rejected_quality" ? "repeat" : rec.status === "pending" ? "received" : "failed";
  if (!clinician) return NextResponse.json({ outcome: s.status === "uploading" ? "uploading" : outcome });
  return NextResponse.json({
    outcome: s.status === "uploading" ? "uploading" : outcome, resultId: rec?.id, status: rec?.status, reasons: rec?.quality?.reasons ?? [],
    retryable: rec?.error?.retryable ?? false, unavailable: rec?.unavailable ?? false,
  });
}

export const GET = withStore(handleGET);
