import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { Patient } from "@/data/schemas";
import { formatShortDate, formatTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n/messages";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** Tablet card version of a patient row (S06 tablet). */
export function PatientCard({ p, t, locale }: { p: Patient; t: T; locale: Locale }) {
  const r = p.latest;
  const status = p.status === "diagnosed" ? (p.gold ? t("patients.statusDiagnosed", { gold: p.gold }) : t("patients.statusDiagnosedNoGold")) : t("patients.statusAtRisk");
  const sub = `${p.code} · ${t("patients.years", { n: p.age })} · ${status}`;
  const trend = r ? `${r.trend > 1 ? "↑" : r.trend < -1 ? "↓" : "→"} ${Math.abs(r.trend)}` : "";
  return (
    <article className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="flex items-start gap-4">
        <Avatar initials={p.initials} className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col leading-[1.45]">
          <Link href={`/patients/${p.id}`} className="font-display text-[20px] font-medium tracking-[-0.025em]">{p.name}</Link>
          <p className="text-[12px] text-ink-muted">{sub}</p>
        </div>
        {r && <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} />}
      </div>
      {r ? (
        <>
          <div className="flex items-center justify-between text-[12px] leading-[1.45]">
            <p className="text-ink-muted">{t("tablet.lastTest", { when: `${formatShortDate(r.at, locale)} · ${formatTime(r.at, locale)}`, trend })}</p>
            <p>{t("tablet.adherence", { n: Math.round((p.adherence ?? 0) * 100) })}</p>
          </div>
          <p className="text-[10px] leading-[1.45] text-ink-muted">{t("tablet.aiLine", { conf: Math.round(r.confidence * 100), quality: t(`quality.${r.quality}`), j: t(`judgment.${r.judgment}`) })}</p>
          <p className="text-[11px] text-cobalt">{t("common.disclaimer")}</p>
        </>
      ) : (
        <p className="text-[12px] text-ink-muted">{p.invitePending ? `${t("patients.invitePending")} · ${t("patients.noRecording")}` : t("patients.noRecording")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" radius="lg" href={`/patients/${p.id}`}>{t("tablet.openProfile")}</Button>
        {p.invitePending ? <Button size="sm" radius="lg">{t("patients.resend")}</Button> : <Button size="sm" radius="lg" href={`/patients/${p.id}/tests?action=request`}>{t("tablet.requestTest")}</Button>}
        <Button size="sm" radius="lg" href={`/messages?patient=${p.id}`}>{t("tablet.message")}</Button>
      </div>
    </article>
  );
}
