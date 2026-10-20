import Link from "next/link";
import { WhatsAppContact } from "@/components/contact/whatsapp-contact";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/cn";
import type { Patient } from "@/data/schemas";
import { getT } from "@/lib/i18n/server";

export type ProfileTab = "overview" | "tests" | "trends" | "clinical" | "notes";
const href = (id: string, tab: ProfileTab) => (tab === "overview" ? `/patients/${id}` : `/patients/${id}/${tab}`);

/** Heading + identity card + tabs shared by every patient profile tab. */
export async function ProfileFrame({ patient, tab, crumb, title, alertCount, headingAction, children }: { patient: Patient; tab: ProfileTab | null; crumb?: string; title?: string; alertCount: number; headingAction?: React.ReactNode; children: React.ReactNode }) {
  const { t } = await getT();
  const tabs: ProfileTab[] = ["overview", "tests", "trends", "clinical", "notes"];
  const sub = [patient.code, t("profile.years", { n: patient.age }), patient.status === "diagnosed" ? (patient.gold ? t("profile.diagnosedCopd", { gold: patient.gold }) : t("profile.diagnosed")) : t("profile.atRisk")].join(" · ");
  const r = patient.latest;
  return (
    <>
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{crumb ?? t("profile.crumb", { name: patient.name.toUpperCase(), code: patient.code })}</p>
          <Title size={30}>{title ?? t("profile.title")}</Title>
        </div>
        {headingAction}
      </div>
      <div className="flex flex-col gap-[18px] rounded-card bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex items-center gap-4">
          <Avatar initials={patient.initials} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
            <p className="font-display text-[22px] font-medium tracking-[-0.025em]">{patient.name}</p>
            <p className="text-[12px] tracking-[-0.005em] text-ink-muted">{sub}</p>
          </div>
          {r && <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} />}
          <span className="rounded-full bg-ink px-[13px] py-2 text-[12px] font-medium leading-[1.45] text-on-accent">{patient.invitePending ? t("profile.inviteSent") : t("profile.active")}</span>
          {alertCount > 0 && <span className="rounded-full bg-surface-soft px-[13px] py-2 text-[12px] leading-[1.45]">{t("profile.alertsN", { n: alertCount })}</span>}
        </div>
        <div className="flex gap-[10px]">
          <Button size="sm" variant="primary" href={`/patients/${patient.id}/tests?action=request`} >{t("profile.requestTest")}</Button>
          <Button size="sm" href={`/patients/${patient.id}/monitoring`}>{t("profile.editPlan")}</Button>
          <Button size="sm" href="?panel=action">{t("profile.clinicalAction")}</Button>
          <Button size="sm" href="?modal=export">{t("profile.exportReport")}</Button>
          <WhatsAppContact patientId={patient.id} firstName={patient.name.split(" ")[0]} hasPhone={!!patient.phone} locked={patient.consent === "revoked"} />
          {!patient.invitePending && <Button size="sm" href={`/patients/${patient.id}/record`}>{t("profile.recordNow")}</Button>}
        </div>
      </div>
      {tab && <nav aria-label="Patient profile" className="flex gap-2 border-b border-line pb-3">
        {tabs.map((k) => (
          <Link key={k} href={href(patient.id, k)} aria-current={k === tab ? "page" : undefined} className={cn("rounded-input px-[15px] py-[10px] text-[13px] font-medium leading-[1.45] tracking-[-0.01em]", k === tab ? "bg-ink text-on-accent" : "text-ink-muted hover:text-ink")}>{t(`profile.tabs.${k}`)}</Link>
        ))}
      </nav>}
      {children}
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
