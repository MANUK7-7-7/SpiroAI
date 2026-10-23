import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession } from "@/lib/api-auth";
import { createSession } from "@/data/repositories/recordings";

const body = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("patient"), token: z.string().min(1), device: z.unknown(), micCheck: z.enum(["passed", "failed", "skipped"]) }),
  z.object({ mode: z.literal("assisted"), patientId: z.string().min(1), consentConfirmed: z.boolean(), device: z.unknown(), micCheck: z.enum(["passed", "failed", "skipped"]), protocol: z.enum(["monitoring", "triage"]).optional() }),
]);

const status = { INVITE_NOT_FOUND: 404, NOT_FOUND: 404, CONSENT_REQUIRED: 403, CONSENT_REVOKED: 403, INVALID_DEVICE: 400 } as Record<string, number>;

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const b = parsed.data;
  if (b.mode === "assisted" && !hasSession(req)) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const out = b.mode === "patient"
    ? createSession({ kind: "patient", token: b.token }, b.device, b.micCheck)
    : createSession({ kind: "clinician", clinicianId: "c-001", patientId: b.patientId, consentConfirmed: b.consentConfirmed }, b.device, b.micCheck, b.protocol);
  return "error" in out ? NextResponse.json(out, { status: status[out.error] ?? 400 }) : NextResponse.json(out, { status: 201 });
}
