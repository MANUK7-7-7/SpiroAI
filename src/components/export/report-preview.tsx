import type { ReportModel } from "@/lib/report/model";
import { Brand } from "@/components/ui/brand";
import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/cn";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** Static rendering of the ReportModel. The PDF renderer consumes the very same model. */
export function ReportPreview({ model, t }: { model: ReportModel; t: T }) {
  const c = model.chart;
  const W = 600, H = 150, PL = 30;
  const X = (x: number) => PL + ((x - (c?.from ?? 0)) / Math.max(1, (c?.to ?? 1) - (c?.from ?? 0))) * (W - PL - 6);
  const Y = (v: number) => 6 + (1 - v / 100) * (H - 12);
  const pts = c?.points.filter((p) => !p.excluded) ?? [];

  return (
    <div className="flex flex-col gap-5 rounded-[28px] bg-surface-soft p-7 shadow-[inset_0_0_0_1px_var(--line)]" aria-label={model.title}>
      <div className="flex items-start justify-between">
        <Brand shape="pill" />
        <p className="text-right text-[10px] leading-[1.45] text-ink-muted">{model.label}<br />{t("export.doc.pageOf", { p: 1, n: model.pages })}</p>
      </div>
      <h3 className="font-display text-[26px] font-medium tracking-[-0.03em]">{model.title}</h3>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{model.meta1}<br />{model.meta2}</p>
      {model.empty && <p className="text-[13px] text-ink-muted">{t("export.emptyPeriod")}</p>}
      {model.headline && (
        <>
          <div className="flex items-center justify-between"><p className="font-display text-[34px] font-medium tracking-[-0.04em]">{model.headline.score} / 100</p><RiskBadge band={model.headline.band} label={model.headline.bandLabel} /></div>
          <div className="flex flex-col gap-[10px] text-[11px] leading-[1.45]">
            <div className="flex gap-5 text-ink-muted"><p>{model.headline.conf}</p><p>{model.headline.quality}</p></div>
            <p className="font-medium text-cobalt">{model.headline.disclaimer}</p>
            <p className="text-ink-muted">{model.headline.final}</p>
          </div>
        </>
      )}
      {model.patientLine && <p className="text-[13px] leading-[1.45]">{model.patientLine}</p>}
      {c && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><RiskBadge band="low" label={t("risk.low")} /><RiskBadge band="moderate" label={t("risk.moderate")} /><RiskBadge band="high" label={t("risk.high")} /><span className="text-[10px] text-ink-muted">{c.baselineLegend}</span></div>
          <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`${model.title}: ${c.baselineLegend}`} className="w-full">
            <rect x={PL} y={Y(c.baseline[1])} width={W - PL - 6} height={Math.max(2, Y(c.baseline[0]) - Y(c.baseline[1]))} fill="var(--cobalt-tint)" />
            {[100, 75, 50, 25].map((v) => <g key={v}><line x1={PL} x2={W - 6} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={PL - 6} y={Y(v) + 3} textAnchor="end" fontSize="8" className="fill-ink-muted font-mono">{v}</text></g>)}
            {pts.slice(1).map((p, i) => <line key={p.t} x1={X(pts[i].t)} y1={Y(pts[i].v)} x2={X(p.t)} y2={Y(p.v)} stroke="var(--cobalt)" strokeWidth={2} strokeDasharray={(p.t - pts[i].t) / 86_400_000 > 10 ? "4 4" : undefined} />)}
            {c.axis.map((a, i) => <text key={a.t} x={i === c.axis.length - 1 ? W - 6 : X(a.t)} y={H + 12} fontSize="8" textAnchor={i === c.axis.length - 1 ? "end" : "start"} className="fill-ink-muted">{a.label}</text>)}
          </svg>
          <p className="text-[10px] text-ink-muted">{c.dashedNote}</p>
        </div>
      )}
      {model.latestMetrics && <p className="text-[11px] leading-[1.45]">{model.latestMetrics}</p>}
      {model.doctorNote && <p className="text-[11px] leading-[1.45]">{model.doctorNote}</p>}
      {model.tests && (
        <div className="flex flex-col gap-2"><p className="text-[12px] font-medium">{model.tests.title}</p>{model.tests.rows.slice(0, 4).map((r) => <p key={r.when} className="text-[10px] text-ink-muted">{r.when} · {r.risk} · {r.meta}</p>)}</div>
      )}
      <div className={cn("rounded-[20px] bg-cobalt-tint p-4")}>
        <p className="text-[12px] font-medium text-cobalt">{model.disclaimer.title}</p>
        <p className="mt-1 text-[10px] leading-[1.45] text-ink-muted">{model.disclaimer.body}</p>
      </div>
    </div>
  );
}
