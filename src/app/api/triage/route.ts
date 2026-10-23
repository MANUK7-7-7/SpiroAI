import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { createTriage } from "@/data/repositories/triage";

const body = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  centre: z.string().min(1),
  consent: z.literal(true),
  answers: z.object({ sex: z.enum(["f", "m"]), age: z.number().int().min(40).max(110), packYears: z.number().min(10).max(200), dyspnea: z.boolean(), phlegm: z.boolean(), cough: z.boolean(), priorSpirometry: z.boolean() }),
});

export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const t = createTriage(parsed.data, "Dr. Elena Morales");
  return NextResponse.json({ id: t.id, patientId: t.patientId, code: t.code }, { status: 201 });
}
