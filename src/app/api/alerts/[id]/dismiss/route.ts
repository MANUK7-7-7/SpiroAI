import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { dismissAlert } from "@/data/repositories/alerts";
import { withStore } from "@/data/persist";

const body = z.object({ reason: z.string().trim().min(5).max(500) });

async function handlePOST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "REASON_REQUIRED" }, { status: 400 });
  const alert = await dismissAlert((await params).id, parsed.data.reason, "Dr. Elena Morales");
  return alert ? NextResponse.json({ alert }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export const POST = withStore(handlePOST);
