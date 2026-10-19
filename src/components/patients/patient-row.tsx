import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/cn";
import type { Patient } from "@/data/schemas";
import { formatShortDate, formatTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n/messages";

type T = (key: string, vars?: Record<string, string | number>) => string;

export const patientColumns = "grid grid-cols-[230px_155px_190px_66px_122px_85px_80px] gap-[14px]";

export function PatientRow({ p, t, locale }: { p: Patient; t: T; locale: Locale }) {
  const identity = `${p.code} · ${t("patients.years", { n: p.age })}`;

  if (p.invitePending) {
    return (
      <div className="flex items-center gap-4 bg-surface-soft p-4">
        <div className="flex min-w-0 flex-1 flex-col text-ink-muted">
          <p className="text-[14px] font-medium leading-[1.45]">{p.name}</p>
          <p className="text-[11px] leading-[1.45]">{identity} · {p.status === "at_risk" ? t("patients.statusAtRisk") : t("patients.options.diagnosed")} · {t("patients.invitePending")}</p>
        </div>
        <p className="whitespace-nowrap text-[12px] text-ink-muted">{t("patients.noRecording")}</p>
        <Button size="sm" radius="lg">{t("patients.resend")}</Button>
      </div>
    );
  }

  const r = p.latest;
  const status = p.status === "diagnosed" ? (p.gold ? t("patients.statusDiagnosed", { gold: p.gold }) : t("patients.statusDiagnosedNoGold")) : t("patients.statusAtRisk");
  const arrow = !r ? "" : r.trend > 0 ? "↑" : r.trend < 0 ? "↓" : "→";
  return (
    <div className={cn(patientColumns, "items-center border-b border-line px-3 py-[18px]")}>
      <Link href={`/patients/${p.id}`} className="flex flex-col gap-1">
        <span className="text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-ink">{p.name}</span>
        <span className="text-[11px] leading-[1.45] text-ink-muted">{identity}</span>
      </Link>
      <p className="text-[12px] leading-[1.45] text-ink">{status}</p>
      {r && (
        <div className="flex flex-col items-start gap-1">
          <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} />
          <p className="text-[9px] leading-[1.45] text-ink-muted">{t("patients.ai", { conf: Math.round(r.confidence * 100), quality: t(`quality.${r.quality}`) })}</p>
          <p className="text-[9px] leading-[1.45] text-ink-muted">{t("patients.judgment", { judgment: t(`judgment.${r.judgment}`) })}</p>
        </div>
      )}
      <p className="font-mono text-[12px] text-ink">{r ? `${arrow} ${Math.abs(r.trend)}` : "—"}</p>
      <p className="text-[12px] leading-[1.45] text-ink-muted">{r ? `${formatShortDate(r.at, locale)} · ${formatTime(r.at, locale)}` : "—"}</p>
      <p className="font-mono text-[13px] text-ink">{p.adherence !== undefined ? `${Math.round(p.adherence * 100)}%` : "—"}</p>
      <div className="flex flex-col text-[11px] leading-[1.45] text-cobalt">
        <Link href={`/patients/${p.id}/tests?action=request`}>{t("patients.requestTest")}</Link>
        <Link href={`/messages?patient=${p.id}`}>{t("patients.message")}</Link>
      </div>
    </div>
  );
}
