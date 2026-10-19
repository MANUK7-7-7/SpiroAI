import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { addEvent } from "@/data/repositories/results";

const body = z.object({ type: z.enum(["medication", "spirometry", "doctor_note", "exacerbation", "other"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), detail: z.string().max(200).default("") });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  return NextResponse.json({ event: await addEvent({ patientId: (await params).id, ...parsed.data }) });
}
