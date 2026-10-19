import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { createPatient } from "@/data/repositories/patients";

const body = z
  .object({
    name: z.string().trim().min(3),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sex: z.enum(["f", "m"]),
    packYears: z.number().min(0).max(200),
    phone: z.string().trim().max(40).optional(),
    email: z.string().email().optional().or(z.literal("")),
    status: z.enum(["diagnosed", "at_risk"]),
    gold: z.number().int().min(1).max(4).optional(),
    ratio: z.string().max(10).optional(),
  })
  .refine((v) => v.phone || v.email, { path: ["phone"] })
  .refine((v) => v.status !== "diagnosed" || v.gold, { path: ["gold"] });

export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const { patient, token } = await createPatient({ ...parsed.data, email: parsed.data.email || undefined });
  return NextResponse.json({ patient: { id: patient.id, code: patient.code, name: patient.name }, token }, { status: 201 });
}
