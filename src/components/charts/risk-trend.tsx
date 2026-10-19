"use client";

import { useMemo, useState } from "react";
import { RiskBadge } from "@/components/ui/risk-badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { useT } from "@/lib/i18n/client";
import { monthAxis, rangeStart } from "./axis";
import { TrendChart } from "./trend-chart";
import type { RiskBand } from "@/config/risk-bands";

export type RiskItem = { id: string; t: number; v: number; when: string; band: RiskBand; excluded?: boolean };

type Props = {
  items: RiskItem[];
  baseline: [number, number];
  now: number;
  patientName: string;
  /** "glance" is the small non-interactive overview version; "full" has range chips and a selected-point line. */
  variant: "glance" | "full";
  controls?: React.ReactNode;
  /** Rendered between the chart note and the selected-point line (event markers, trust context). */
  after?: React.ReactNode;
};

const RANGES = ["1M", "3M", "6M", "1Y", "all"] as const;

export function RiskTrend({ items, baseline, now, patientName, variant, controls, after }: Props) {
  const { t, locale } = useT();
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M");
  const first = items.length ? Math.min(...items.map((i) => i.t)) : now;
  const from = variant === "glance" ? Math.min(first, rangeStart(now, "3M", first)) : rangeStart(now, range, first);
  const visible = useMemo(() => items.filter((i) => i.t >= from - 1000), [items, from]);
  const [selectedId, setSelectedId] = useState(items[items.length - 1]?.id);
  const selected = items.find((i) => i.id === selectedId) ?? items[items.length - 1];
  const full = variant === "full";
  const to = Math.max(now, ...items.map((i) => i.t));
  const start = Math.min(from, ...visible.map((i) => i.t));

  return (
    <div className="flex flex-col gap-3">
      {full && (
        <div className="flex items-start justify-between">
          <div className="flex gap-2" role="group" aria-label={t("trends.riskTitle")}>
            {RANGES.map((r) => <FilterChip key={r} label={t(`trends.ranges.${r}`)} selected={r === range} onClick={() => setRange(r)} className="font-normal tracking-normal data-[on]:font-medium" />)}
          </div>
          {controls}
        </div>
      )}
      <div className="flex items-center gap-3">
        <RiskBadge band="low" label={t("risk.low")} />
        <RiskBadge band="moderate" label={t("risk.moderate")} />
        <RiskBadge band="high" label={t("risk.high")} />
        <p className="whitespace-nowrap text-[11px] text-ink-muted">{t("trends.baselineLegend", { lo: baseline[0], hi: baseline[1] })}</p>
      </div>
      {visible.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-muted">{t("trends.empty")}</p>
      ) : (
        <TrendChart
          points={visible.map((i) => ({ id: i.id, t: i.t, v: i.v, when: i.when, valueLabel: t("trends.tooltipValue", { n: i.v, band: t(`risk.${i.band}`) }), excluded: i.excluded }))}
          domain={[0, 100]} ticks={[100, 75, 50, 25]} baseline={baseline} range={[start, to]} axis={monthAxis(start, to, locale)}
          alt={t("trends.chartAlt", { name: patientName, n: items[items.length - 1]?.v ?? 0, when: items[items.length - 1]?.when ?? "", lo: baseline[0], hi: baseline[1] })}
          tableCaption={t("trends.tableCaption")} headers={[t("trends.eventDate"), t("result.indexTitle")]}
          selectedId={full ? selected?.id : items[items.length - 1]?.id} onSelect={full ? setSelectedId : undefined} height={full ? 248 : 168} tooltip={full ? "fixed" : "none"}
        />
      )}
      <p className="text-[10px] leading-[1.45] text-ink-muted">{t("trends.missing")}</p>
      {after}
      {full && selected && <p className="text-[11px] text-ink-muted" aria-live="polite">{t("trends.selected", { when: selected.when, n: selected.v, band: t(`risk.${selected.band}`), lo: baseline[0], hi: baseline[1] })}</p>}
    </div>
  );
}
