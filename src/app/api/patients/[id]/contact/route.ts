import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { whatsappUrl } from "@/lib/whatsapp";
import { getPatient } from "@/data/repositories/patients";
import { recordAudit } from "@/data/store";
import { withStore } from "@/data/persist";

const body = z.object({ text: z.string().max(2000), template: z.string().max(40).optional() });

/**
 * Patient communication happens on WhatsApp, outside SpiroAI. We only build the link and record
 * that the clinician opened it; the conversation itself is not stored here.
 */
async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const p = await getPatient((await params).id);
  if (!p) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!p.phone) return NextResponse.json({ error: "NO_PHONE" }, { status: 422 });
  recordAudit({ action: "contact.whatsapp", subject: p.id, detail: parsed.data.template ?? "free" });
  return NextResponse.json({ url: whatsappUrl(p.phone, parsed.data.text) });
}

export const POST = withStore(handlePOST);
