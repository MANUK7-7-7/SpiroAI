"use client";

import { useState } from "react";
import { FilterChip } from "@/components/ui/filter-chip";
import { metricCatalog, metricOrder } from "@/config/metrics";
import type { MetricId } from "@/ai/contracts";
import { useT } from "@/lib/i18n/client";
import { monthAxis } from "./axis";
import { TrendChart } from "./trend-chart";

export type MetricSeries = Record<MetricId, { baseline: number; sd: number; points: { id: string; t: number; v: number; when: string }[] }>;

/** Individual metric values against the personal baseline (shaded band = baseline ± 1 SD). */
export function MetricTrend({ series, from, to }: { series: MetricSeries; from: number; to: number }) {
  const { t, locale } = useT();
  const [metric, setMetric] = useState<MetricId>("jitter");
  const s = series[metric];
  const cat = metricCatalog[metric];
  const fmt = (v: number) => `${v.toFixed(cat.decimals)}${cat.unit === "%" ? "%" : ` ${cat.unit}`}`;
  const latest = s.points[s.points.length - 1];
  const vals = s.points.map((p) => p.v);
  const lo = Math.min(...vals, s.baseline - s.sd) - s.sd;
  const hi = Math.max(...vals, s.baseline + s.sd) + s.sd;
  const step = (hi - lo) / 4;
  const ticks = [0, 1, 2, 3].map((i) => hi - step * i);
  const delta = latest.v - s.baseline;
  const name = t(`result.metricNames.${metric}`);
  const selectedId = latest.id;

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("trends.metricsTitle")}>
        {metricOrder.map((m) => <FilterChip key={m} label={t(`result.metricNames.${m}`)} selected={m === metric} onClick={() => setMetric(m)} className="font-normal tracking-normal" />)}
      </div>
      <div className="flex flex-col gap-1 leading-[1.45]">
        <p className="font-display text-[28px] font-medium tracking-[-0.035em]">{t("trends.metricLine", { name, value: fmt(latest.v) })}</p>
        <p className="text-[12px] text-cobalt">{t("trends.delta", { arrow: delta >= 0 ? "↑" : "↓", delta: fmt(Math.abs(delta)) })}</p>
      </div>
      <TrendChart
        points={s.points.map((p) => ({ ...p, valueLabel: `${name} ${fmt(p.v)}` }))} domain={[lo, hi]} ticks={ticks} tickLabel={(v) => v.toFixed(cat.decimals)}
        baseline={[s.baseline - s.sd, s.baseline + s.sd]} range={[from, to]} axis={monthAxis(from, to, locale)} selectedId={selectedId} height={200}
        alt={t("trends.metricAlt", { name, value: fmt(latest.v), base: fmt(s.baseline) })} tableCaption={name} headers={[t("trends.eventDate"), name]}
      />
      <p className="text-[10px] leading-[1.45] text-ink-muted">{t("trends.missing")}</p>
    </>
  );
}
