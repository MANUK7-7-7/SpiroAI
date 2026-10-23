import { after, NextResponse } from "next/server";
import { AUDIO_TASKS } from "@/ai/contracts";
import { hasSession } from "@/lib/api-auth";
import { authorize, complete } from "@/data/repositories/recordings";
import { loadChunks, persistStore, saveAudio, withStore } from "@/data/persist";

async function handle(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = authorize((await params).id, req.headers.get("x-recording-secret"), hasSession(req));
  if (!s) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  // Chunks may have reached other instances; take the fuller set.
  for (const task of AUDIO_TASKS) {
    const shared = await loadChunks(s.id, task);
    if (shared && shared.length > (s.chunks[task]?.length ?? 0)) s.chunks[task] = shared;
  }
  const out = complete(s);
  if ("error" in out) return NextResponse.json(out, { status: 422 });
  const takes = Object.entries(s.completed);
  // Keep the function alive until the result is analysed and saved for every instance.
  after(async () => {
    await out.job;
    await persistStore();
    await Promise.all(takes.map(([task, wav]) => saveAudio(s.id, task, wav).catch(() => undefined)));
  });
  return NextResponse.json({ status: "processing" }, { status: 202 });
}

export const POST = withStore(handle);
