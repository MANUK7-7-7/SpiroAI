import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { whatsappUrl } from "@/lib/whatsapp";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { createTestLink } from "@/data/repositories/recordings";

/** The message is written in the clinician's language by the client; `{url}` marks where the link goes. */
const body = z.object({ message: z.string().max(1000).includes("{url}") });

/**
 * Creates a one-test recording link and the WhatsApp link that sends it to the patient's phone.
 * The message carries no clinical information: only the patient's first name and the link.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const me = await getCurrentClinician();
  const created = createTestLink((await params).id, me.id);
  if ("error" in created) return NextResponse.json({ error: created.error }, { status: created.error === "NOT_FOUND" ? 404 : 409 });
  const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  const url = `${origin}/r/${created.token}`;
  const text = parsed.data.message.replace("{url}", url);
  return NextResponse.json({ url, expiresAt: created.expiresAt, whatsappUrl: created.patient.phone ? whatsappUrl(created.patient.phone, text) : null });
}
