import { NextResponse } from "next/server";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { auditFor, getAlert } from "@/data/repositories/alerts";
import { withStore } from "@/data/persist";

async function handleGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const { id } = await params;
  const a = getAlert(id);
  if (!a) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const base = [{ id: "fired", at: a.firedAt, actor: "system", action: "alert.fired", subject: id, detail: a.rule }];
  if (a.resolvedAt) base.push({ id: "closed", at: a.resolvedAt, actor: a.resolvedBy ?? "", action: `alert.${a.state}`, subject: id, detail: a.dismissedReason ?? a.resolution ?? "" });
  return NextResponse.json({ events: [...base, ...auditFor(id)] });
}

export const GET = withStore(handleGET);
