import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { submitReview } from "@/data/repositories/results";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { withStore } from "@/data/persist";

const body = z.object({
  judgment: z.enum(["agree", "disagree"]),
  note: z.string().max(2000),
  outcome: z.enum(["no_concern", "follow_up", "repeat_requested", "unreliable"]).default("follow_up"),
  shareDeidentifiedFeedback: z.boolean().default(false),
});

/** The AI never reviews itself: every review is initiated and confirmed by a clinician. */
async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const me = await getCurrentClinician();
  const review = await submitReview({ resultId: (await params).id, ...parsed.data, clinicianId: me.id, clinicianName: me.fullName.replace(/^Dr\.\s*/, "").replace(/^(\w)\w*\s/, "$1. ") });
  return NextResponse.json({ review });
}

export const POST = withStore(handlePOST);
