import { NextResponse } from "next/server";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { getPatient } from "@/data/repositories/patients";
import { store } from "@/data/store";
import { withStore } from "@/data/persist";

async function handleGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const p = await getPatient((await params).id);
  if (!p) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const alertId = new URL(req.url).searchParams.get("alert");
  const alert = store.alerts.find((a) => a.id === alertId);
  return NextResponse.json({ patient: { id: p.id, name: p.name, code: p.code, consent: p.consent, hasPhone: !!p.phone }, alert: alert ? { id: alert.id, code: alert.code } : undefined });
}

export const GET = withStore(handleGET);
