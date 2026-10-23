import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { updateMember } from "@/data/repositories/settings";
import { withStore } from "@/data/persist";

const body = z.object({ op: z.enum(["resend", "cancel", "remove"]) });

async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const m = updateMember((await params).id, parsed.data.op);
  return m ? NextResponse.json({ member: m }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export const POST = withStore(handlePOST);
