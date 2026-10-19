import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { sendMessage } from "@/data/repositories/messages";

const body = z.object({ patientId: z.string(), text: z.string().trim().min(1).max(2000), template: z.string().optional() });

export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    return NextResponse.json({ message: sendMessage(parsed.data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "MESSAGING_LOCKED" }, { status: 403 });
  }
}
