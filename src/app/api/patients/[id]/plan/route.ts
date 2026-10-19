import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { planFor } from "@/data/fixtures/profile";
import { monitoringPlanSchema } from "@/data/schemas";
import { recordAudit, store } from "@/data/store";

const body = z.object({
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  customDays: z.number().int().min(1).max(60).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  sensitivity: z.enum(["standard", "high", "low"]),
  durationWeeks: z.number().int().min(1).max(52),
  reviewOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notifyPatient: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const { id } = await params;
  const parsed = body.safeParse(await req.json().catch(() => null));
  const current = store.plans.get(id) ?? planFor(id);
  if (!parsed.success || !current) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const { notifyPatient, customDays: _c, ...rest } = parsed.data;
  const next = monitoringPlanSchema.parse({ ...current, ...rest });
  store.plans.set(id, next);
  recordAudit({ action: "plan.saved", subject: id, detail: `${rest.frequency} ${rest.time}${notifyPatient ? " · patient notified" : ""}` });
  return NextResponse.json({ plan: next });
}
