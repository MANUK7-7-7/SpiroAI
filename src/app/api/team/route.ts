import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { inviteMember } from "@/data/repositories/settings";

const body = z.object({ email: z.string().email(), role: z.enum(["doctor", "nurse", "admin"]) });

export async function POST(req: Request) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  return NextResponse.json({ member: inviteMember(parsed.data.email, parsed.data.role) });
}
