"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ChartPoint = { id: string; t: number; v: number; when: string; valueLabel: string; excluded?: boolean };

type Props = {
  points: ChartPoint[];
  domain: [number, number];
  ticks: number[];
  tickLabel?: (v: number) => string;
  baseline?: [number, number];
  range: [number, number];
  axis: { t: number; label: string }[];
  alt: string;
  tableCaption: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
  /** Gaps longer than this many days are drawn dashed: no recordings in between. */
  gapDays?: number;
  headers: [string, string];
};

const PAD = { l: 34, r: 10, t: 10, b: 24 };

/**
 * Time series with a personal-baseline band, dashed segments for missing data, an exact-value
 * tooltip, keyboard selection (arrow keys) and a text alternative (hidden table).
 */
export function TrendChart({ points, domain, ticks, tickLabel = String, baseline, range, axis, alt, tableCaption, selectedId, onSelect, height = 248, gapDays = 10, headers }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(780);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(320, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = width - PAD.l - PAD.r;
  const plotH = height - PAD.t - PAD.b;
  const x = (t: number) => PAD.l + ((t - range[0]) / (range[1] - range[0])) * plotW;
  const y = (v: number) => PAD.t + (1 - (v - domain[0]) / (domain[1] - domain[0])) * plotH;

  const drawn = useMemo(() => points.filter((p) => !p.excluded).sort((a, b) => a.t - b.t), [points]);
  const segments = useMemo(() => drawn.slice(1).map((p, i) => ({ from: drawn[i], to: p, dashed: (p.t - drawn[i].t) / 86_400_000 > gapDays })), [drawn, gapDays]);
  const selected = drawn.find((p) => p.id === selectedId) ?? drawn[drawn.length - 1];

  const onKey = (e: React.KeyboardEvent) => {
    if (!selected || !onSelect) return;
    const i = drawn.findIndex((p) => p.id === selected.id);
    const next = e.key === "ArrowLeft" ? drawn[i - 1] : e.key === "ArrowRight" ? drawn[i + 1] : undefined;
    if (next) { e.preventDefault(); onSelect(next.id); }
  };

  const tipW = 132;
  const tipX = selected ? Math.min(Math.max(x(selected.t) - tipW / 2, PAD.l), width - PAD.r - tipW) : 0;
  const tipY = selected ? (y(selected.v) < PAD.t + 60 ? y(selected.v) + 12 : y(selected.v) - 60) : 0;

  return (
    <div ref={wrap} className="relative w-full" onKeyDown={onKey}>
      <svg width={width} height={height} role="img" aria-label={alt} className="block overflow-visible">
        {baseline && <rect x={PAD.l} y={y(baseline[1])} width={plotW} height={Math.max(2, y(baseline[0]) - y(baseline[1]))} fill="var(--cobalt-tint)" />}
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y(tk)} y2={y(tk)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={y(tk) + 3} textAnchor="end" className="fill-ink-muted font-mono" fontSize="10">{tickLabel(tk)}</text>
          </g>
        ))}
        {segments.map((s) => (
          <line key={s.to.id} x1={x(s.from.t)} y1={y(s.from.v)} x2={x(s.to.t)} y2={y(s.to.v)} stroke="var(--cobalt)" strokeWidth={2} strokeLinecap="round" strokeDasharray={s.dashed ? "5 5" : undefined} />
        ))}
        {drawn.map((p) => {
          const on = p.id === selected?.id;
          return (
            <g key={p.id} tabIndex={0} role="button" aria-label={`${p.when}: ${p.valueLabel}`} aria-pressed={on} onClick={() => onSelect?.(p.id)} onFocus={() => onSelect?.(p.id)} className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-cobalt">
              <circle cx={x(p.t)} cy={y(p.v)} r={12} fill="transparent" />
              <circle cx={x(p.t)} cy={y(p.v)} r={on ? 5.5 : 3} fill={on ? "var(--cobalt)" : "var(--surface)"} stroke="var(--cobalt)" strokeWidth={on ? 3 : 2} />
            </g>
          );
        })}
      </svg>
      {selected && (
        <div aria-hidden className="pointer-events-none absolute rounded-input bg-ink p-[10px] text-[11px] leading-[1.45] text-on-accent" style={{ left: tipX, top: tipY, width: tipW }}>
          <p>{selected.when}</p>
          <p>{selected.valueLabel}</p>
        </div>
      )}
      <div className="relative mt-1 h-4 text-[10px] text-ink-muted" style={{ marginLeft: 0 }} aria-hidden>
        {axis.map((a, i) => (
          <span key={a.t} className={cn("absolute whitespace-nowrap", i === axis.length - 1 && "-translate-x-full", i !== 0 && i !== axis.length - 1 && "-translate-x-1/2")} style={{ left: x(a.t) }}>{a.label}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead><tr><th>{headers[0]}</th><th>{headers[1]}</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.id}><td>{p.when}</td><td>{p.valueLabel}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
