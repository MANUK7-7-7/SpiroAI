import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { getAlert, resolveAlert } from "@/data/repositories/alerts";
import { sendMessage } from "@/data/repositories/messages";
import { clinicalActionSchema } from "@/data/schemas";
import { nextId, recordAudit, store } from "@/data/store";

const body = z.object({
  patientId: z.string(),
  alertId: z.string().optional(),
  resultId: z.string().optional(),
  kinds: z.array(z.enum(["spirometry", "follow_up_visit", "referral", "adjust_frequency", "repeat_test"])).min(1),
  followUp: z.object({ date: z.string(), time: z.string() }).optional(),
  messageToPatient: z.string().max(2000).optional(),
  internalNote: z.string().max(2000).optional(),
  notify: z.boolean(),
});

/** A clinical action exists only because a clinician confirmed it. */
export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const { notify, ...rest } = parsed.data;
  const action = clinicalActionSchema.parse({ id: nextId("ca"), ...rest, notified: notify && !!rest.messageToPatient, confirmedBy: "Dr. Elena Morales", status: "pending", at: new Date().toISOString().replace("Z", "+00:00") });
  store.actions.unshift(action);
  recordAudit({ action: "action.confirmed", subject: action.patientId, detail: action.kinds.join(",") });
  if (action.notified) sendMessage({ patientId: action.patientId, text: action.messageToPatient!, template: "clinical_action" });
  if (rest.alertId && getAlert(rest.alertId)) resolveAlert(rest.alertId, "Dr. Elena Morales", "Clinical action planned. Action remains pending in profile.");
  return NextResponse.json({ action }, { status: 201 });
}
