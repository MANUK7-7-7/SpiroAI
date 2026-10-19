import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { addNote } from "@/data/repositories/results";

const body = z.object({ text: z.string().trim().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  return NextResponse.json({ note: await addNote((await params).id, parsed.data.text, "Dr. Elena Morales") });
}
