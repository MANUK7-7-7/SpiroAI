import { metricCatalog } from "@/config/metrics";
import { DEMO_NOW } from "@/config/demo";
import { getProfile, listRecords, reviewLabelKey } from "@/data/repositories/results";
import { recordAudit } from "@/data/store";
import { monthAxis } from "@/components/charts/axis";
import { formatDateTime, formatDay, formatDayYear } from "@/lib/format";
import { getMessages, translate, type Locale } from "@/lib/i18n/messages";

export type ReportOptions = { from?: string; to?: string; sections: Record<"summary" | "trend" | "tests" | "alerts" | "notes", boolean>; audience: "clinical" | "patient"; locale: Locale };

/**
 * One model drives BOTH the live preview and the server-side PDF, so they cannot drift.
 * The disclaimer is part of the model and cannot be switched off.
 */
export type ReportModel = {
  locale: Locale;
  audience: "clinical" | "patient";
  title: string;
  label: string;
  meta1: string;
  meta2: string;
  headline?: { score: number; band: "low" | "moderate" | "high"; bandLabel: string; conf: string; quality: string; disclaimer: string; final: string };
  patientLine?: string;
  chart?: { points: { t: number; v: number; excluded: boolean }[]; baseline: [number, number]; from: number; to: number; baselineLegend: string; dashedNote: string; axis: { t: number; label: string }[] };
  latestMetrics?: string;
  doctorNote?: string;
  tests?: { title: string; rows: { when: string; risk: string; meta: string; judgment: string }[] };
  alerts?: { title: string; rows: string[] };
  notes?: { title: string; rows: { when: string; text: string }[] };
  pages: number;
  disclaimer: { title: string; body: string };
  empty: boolean;
  generatedAt: string;
};

const DAY = 86_400_000;

export async function buildReport(patientId: string, opts: ReportOptions, audit = false): Promise<ReportModel | undefined> {
  const m = getMessages(opts.locale);
  const t = (k: string, v?: Record<string, string | number>) => translate(m, k, v);
  const profile = await getProfile(patientId);
  if (!profile) return undefined;
  const { patient } = profile;
  const to = opts.to ? Date.parse(`${opts.to}T23:59:59-03:00`) : Date.parse(DEMO_NOW);
  const from = opts.from ? Date.parse(`${opts.from}T00:00:00-03:00`) : to - 76 * DAY;
  const all = (await listRecords(patientId)).filter((r) => r.result.status === "ready");
  const inRange = all.filter((r) => Date.parse(r.result.createdAt) >= from && Date.parse(r.result.createdAt) <= to);
  const latest = inRange[0];
  const iso = (n: number) => new Date(n).toISOString();
  const fromLabel = formatDay(iso(from), opts.locale);
  const toLabel = formatDayYear(iso(to), opts.locale);
  const patientView = opts.audience === "patient";

  const model: ReportModel = {
    locale: opts.locale, audience: opts.audience,
    label: t("export.doc.label"), title: t(patientView ? "export.doc.titlePatient" : "export.doc.title"),
    meta1: t("export.doc.meta1", { name: patient.name, code: patient.code, age: patient.age, gold: patient.gold ? ` · GOLD ${patient.gold}` : "" }),
    meta2: t("export.doc.meta2", { from: fromLabel, to: toLabel, doctor: "Dr. Elena Morales" }),
    pages: 1 + (opts.sections.tests && !patientView ? 1 : 0) + ((opts.sections.alerts || opts.sections.notes) && !patientView ? 1 : 0),
    disclaimer: { title: t("export.doc.disclaimerTitle"), body: t("export.doc.disclaimerBody") },
    empty: inRange.length === 0, generatedAt: new Date().toISOString(),
  };
  if (!latest) return model;
  const r = latest.result;
  const label = reviewLabelKey(latest);

  if (opts.sections.summary) {
    model.headline = {
      score: r.riskIndex!, band: r.band!, bandLabel: t(`risk.${r.band}`),
      conf: t("export.doc.conf", { n: Math.round((r.confidence ?? 0) * 100) }), quality: t("export.doc.quality", { q: t(`quality.${r.quality?.level ?? "good"}`) }),
      disclaimer: t("common.disclaimer"), final: t("export.doc.final", { j: translate(m, label.key, label.vars) }),
    };
    if (patientView) model.patientLine = `${t("export.doc.patientBand", { band: t(`risk.${r.band}`).toLowerCase() })} ${t("export.doc.patientNext")}`;
  }
  if (opts.sections.trend && profile.history) {
    const pts = inRange.map((x) => ({ t: Date.parse(x.result.createdAt), v: x.result.riskIndex!, excluded: x.result.quality?.level === "poor" })).sort((a, b) => a.t - b.t);
    const first = pts[0]?.t ?? from;
    const axis = monthAxis(first, to, opts.locale);
    model.chart = { points: pts, baseline: profile.history.baselineBand, from: first, to, baselineLegend: t("export.doc.baseline", { lo: profile.history.baselineBand[0], hi: profile.history.baselineBand[1] }), dashedNote: t("export.doc.dashed"), axis };
  }
  if (!patientView) {
    if (opts.sections.summary && r.features) {
      const f = r.features;
      const line = [`F0 ${f.f0Hz} Hz`, `Jitter ${f.jitterPct.toFixed(2)}%`, `Shimmer ${f.shimmerPct.toFixed(1)}%`, `HNR ${f.hnrDb.toFixed(1)} dB`, `MPT ${f.mptSec.toFixed(1)} s`].join(" · ");
      model.latestMetrics = t("export.doc.latestMetrics", { line });
      void metricCatalog;
    }
    if (opts.sections.summary && profile.notes[0]) model.doctorNote = t("export.doc.doctorNote", { note: profile.notes[0].text });
    if (opts.sections.tests) model.tests = { title: t("export.doc.testsTitle"), rows: inRange.map((x) => { const l = reviewLabelKey(x); return { when: formatDateTime(x.result.createdAt, opts.locale), risk: `${x.result.riskIndex} · ${t(`risk.${x.result.band}`)}`, meta: `AI ${Math.round((x.result.confidence ?? 0) * 100)}% · ${t(`quality.${x.result.quality?.level ?? "good"}`)}`, judgment: translate(m, l.key, l.vars) }; }) };
    if (opts.sections.alerts) model.alerts = { title: t("export.doc.alertsTitle"), rows: profile.alerts.map((a) => t(`alerts.rule.${a.rule}.title`, a.params as Record<string, string | number>)) };
    if (opts.sections.notes) model.notes = { title: t("export.doc.notesTitle"), rows: profile.notes.map((n) => ({ when: formatDateTime(n.at, opts.locale), text: n.text })) };
  }
  if (audit) recordAudit({ action: "report.exported", subject: patientId, detail: `${opts.audience} · ${Object.entries(opts.sections).filter(([, v]) => v).map(([k]) => k).join(",")}` });
  return model;
}
