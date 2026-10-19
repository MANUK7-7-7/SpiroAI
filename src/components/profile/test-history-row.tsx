import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { ResultView } from "@/data/repositories/results";
import { reviewLabelKey } from "@/data/repositories/results";
import { formatShortDate, formatTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n/messages";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function TestHistoryRow({ rec, t, locale }: { rec: ResultView; t: T; locale: Locale }) {
  const r = rec.result;
  const label = reviewLabelKey(rec);
  const year = new Date(r.createdAt).getFullYear();
  return (
    <div className="flex items-center gap-5 rounded-[16px] bg-surface-soft p-4">
      <div className="flex w-[180px] shrink-0 flex-col leading-[1.45]">
        <p className="text-[14px] font-medium tracking-[-0.01em]">{formatShortDate(r.createdAt, locale)} · {formatTime(r.createdAt, locale)}</p>
        <p className="text-[11px] text-ink-muted">{t("tests.rowSub", { year })}</p>
      </div>
      {r.status === "ready" && r.band ? <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} /> : <span className="text-[12px] text-ink-muted">—</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.45]">
        <p className="text-[12px] tracking-[-0.005em]">{t("tests.meta", { conf: Math.round((r.confidence ?? 0) * 100), quality: t(`quality.${r.quality?.level ?? "poor"}`) })}</p>
        <p className="text-[11px] text-ink-muted">{t("tests.final", { j: t(label.key, label.vars) })}</p>
      </div>
      <Button size="sm" radius="lg" href={`/results/${r.id}`}>{t("tests.open")}</Button>
    </div>
  );
}
export { Link };
