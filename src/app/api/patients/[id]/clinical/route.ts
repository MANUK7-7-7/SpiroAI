import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { recordAudit } from "@/data/store";
import { withStore } from "@/data/persist";

const body = z.object({ diagnosis: z.string().max(200), goldStage: z.number().int().min(1).max(4).optional(), fev1Fvc: z.string().max(100), fev1Pct: z.number().min(0).max(200) });

/** Clinical edits are audited with author, time and previous value. (Demo: the change is logged, fixtures stay read-only.) */
async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  recordAudit({ action: "clinical.edited", subject: (await params).id, detail: JSON.stringify(parsed.data) });
  return NextResponse.json({ ok: true });
}

export const POST = withStore(handlePOST);
