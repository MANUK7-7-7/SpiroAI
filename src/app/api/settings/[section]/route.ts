import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { saveSection } from "@/data/repositories/settings";
import { settingsSchemas, type SettingsSection } from "@/data/settings-schemas";

export async function PUT(req: Request, { params }: { params: Promise<{ section: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const section = (await params).section as SettingsSection;
  if (!(section in settingsSchemas)) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    return NextResponse.json({ value: await saveSection(section, await req.json().catch(() => null)) });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: "INVALID", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
    throw e;
  }
}
