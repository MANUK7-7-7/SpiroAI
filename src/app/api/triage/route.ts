import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, sessionOf, unauthorized } from "@/lib/api-auth";
import { AGENT, AGENT_SESSION } from "@/data/fixtures/agent";
import { createTriage } from "@/data/repositories/triage";
import { withStore } from "@/data/persist";

const body = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  centre: z.string().min(1),
  consent: z.literal(true),
  smoking: z.enum(["current", "former", "never"]).optional(),
  answers: z.object({ sex: z.enum(["f", "m"]), age: z.number().int().min(0).max(110), packYears: z.number().min(0).max(200), dyspnea: z.boolean(), phlegm: z.boolean(), cough: z.boolean(), priorSpirometry: z.boolean() }),
});

async function handlePOST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  // A health agent triages on home visits; the result goes to the doctor at the centre.
  const agent = sessionOf(req) === AGENT_SESSION;
  const t = agent ? createTriage(parsed.data, AGENT.name, { homeVisit: true }) : createTriage(parsed.data, "Dr. Elena Morales");
  return NextResponse.json({ id: t.id, patientId: t.patientId, code: t.code }, { status: 201 });
}

export const POST = withStore(handlePOST);
