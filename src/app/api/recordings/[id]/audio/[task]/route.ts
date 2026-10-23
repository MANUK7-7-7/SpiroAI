import { NextResponse } from "next/server";
import { audioTaskIdSchema } from "@/ai/contracts";
import { hasSession } from "@/lib/api-auth";
import { authorize, putChunk, receivedChunks } from "@/data/repositories/recordings";
import { loadChunks, saveChunk } from "@/data/persist";
import { withStore } from "@/data/persist";

type P = { params: Promise<{ id: string; task: string }> };

async function find(req: Request, { params }: P) {
  const { id, task } = await params;
  const t = audioTaskIdSchema.safeParse(task);
  const s = authorize(id, req.headers.get("x-recording-secret"), hasSession(req));
  return t.success && s ? { s, task: t.data } : undefined;
}

/** How many chunks the server holds, so an interrupted upload can resume. */
async function handleGET(req: Request, ctx: P) {
  const f = await find(req, ctx);
  return f ? NextResponse.json({ received: receivedChunks(f.s, f.task) }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

async function handlePUT(req: Request, ctx: P) {
  const f = await find(req, ctx);
  if (!f) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const index = Number(new URL(req.url).searchParams.get("index"));
  if (!Number.isInteger(index)) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const bytes = Buffer.from(await req.arrayBuffer());
  // Earlier chunks may have reached another instance.
  if (index > (f.s.chunks[f.task]?.length ?? 0)) {
    const shared = await loadChunks(f.s.id, f.task);
    if (shared) f.s.chunks[f.task] = shared.slice(0, index);
  }
  const out = putChunk(f.s, f.task, index, bytes);
  if (!("error" in out)) await saveChunk(f.s.id, f.task, index, bytes);
  return "error" in out ? NextResponse.json(out, { status: out.error === "TOO_LARGE" ? 413 : 409 }) : NextResponse.json(out);
}

export const GET = withStore(handleGET);
export const PUT = withStore(handlePUT);
