import { NextResponse } from "next/server";
import { hasSession, unauthorized } from "@/lib/api-auth";
import { buildReport, type ReportOptions } from "@/lib/report/model";
import { renderPdf } from "@/lib/report/pdf";
import { locales } from "@/lib/i18n/messages";
import { withStore } from "@/data/persist";

const SECTIONS = ["summary", "trend", "tests", "alerts", "notes"] as const;

async function handleGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSession(req)) return unauthorized();
  const url = new URL(req.url);
  const picked = (url.searchParams.get("sections") ?? SECTIONS.join(",")).split(",");
  const locale = (locales as readonly string[]).includes(url.searchParams.get("lang") ?? "") ? (url.searchParams.get("lang") as ReportOptions["locale"]) : "en";
  const opts: ReportOptions = {
    from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined, locale,
    audience: url.searchParams.get("audience") === "patient" ? "patient" : "clinical",
    sections: Object.fromEntries(SECTIONS.map((s) => [s, picked.includes(s)])) as ReportOptions["sections"],
  };
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "json";
  const { id } = await params;
  // Every view and export is audit logged. Only a PDF download counts as an export.
  const model = await buildReport(id, opts, format === "pdf");
  if (!model) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (format === "json") return NextResponse.json(model);
  if (model.empty) return NextResponse.json({ error: "EMPTY_PERIOD" }, { status: 422 });
  const pdf = await renderPdf(model);
  return new NextResponse(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `${url.searchParams.get("inline") ? "inline" : "attachment"}; filename="spiroai-report-${id}.pdf"`, "cache-control": "private, no-store" } });
}

export const GET = withStore(handleGET);
