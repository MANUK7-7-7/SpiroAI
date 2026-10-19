import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { updateMember } from "@/data/repositories/settings";

const body = z.object({ op: z.enum(["resend", "cancel", "remove"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const m = updateMember((await params).id, parsed.data.op);
  return m ? NextResponse.json({ member: m }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
