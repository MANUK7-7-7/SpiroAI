import { Plus } from "lucide-react";
import { ActivityRow } from "@/components/app/activity-item";
import { EmptyPanel } from "@/components/app/data-state";
import { FocusCard } from "@/components/app/focus-card";
import { KpiCard } from "@/components/app/kpi-card";
import { PageHeading } from "@/components/app/page-heading";
import { PriorityQueueItem } from "@/components/app/priority-queue-item";
import { RiskDistribution } from "@/components/app/risk-distribution";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { DEMO_NOW } from "@/config/demo";
import { getDashboard } from "@/data/repositories/dashboard";
import { parseDemoState } from "@/data/demo-state";
import { countWord } from "@/lib/numbers";
import { formatLongDate, formatShortDate, formatTime, relativeDayTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const { t, locale } = await getT();
  const data = await getDashboard(parseDemoState((await searchParams).state));
  const { kpis, queue, activity, distribution } = data;
  const when = (iso: string) => relativeDayTime(iso, DEMO_NOW, locale, { today: t("dashboard.today"), yesterday: t("dashboard.yesterday") });
  const eyebrow = `${formatLongDate(DEMO_NOW, locale).toUpperCase()} · ${(locale === "es" ? "Clínica Riverside" : "Riverside Clinic").toUpperCase()}`;
  const bandLabel = (b: "low" | "moderate" | "high") => t(`risk.${b}`);
  const activeTotal = kpis.activePatients;

  return (
    <>
      <PageHeading eyebrow={eyebrow} title={t("dashboard.greeting")} action={{ label: t("dashboard.addPatient"), href: "/patients/new", icon: <Plus size={16} strokeWidth={2} aria-hidden /> }} />
      <div className="flex gap-4">
        <KpiCard label={t("dashboard.kpi.active")} value={kpis.activePatients} link={t("dashboard.kpi.activeLink")} href="/patients" />
        <KpiCard label={t("dashboard.kpi.alerts")} value={kpis.openAlerts} link={t("dashboard.kpi.alertsLink", { n: kpis.highPriorityAlerts })} href="/alerts" />
        <KpiCard label={t("dashboard.kpi.results")} value={kpis.resultsToReview} link={t("dashboard.kpi.resultsLink", { n: kpis.receivedThisMorning })} href="/patients?filter=review" />
        <KpiCard label={t("dashboard.kpi.overdue")} value={kpis.overdueTests} link={t("dashboard.kpi.overdueLink")} href="/patients?filter=overdue" />
      </div>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Card>
            <CardHeading title={t("dashboard.queue.title")} description={t("dashboard.queue.subtitle")} />
            <div className="flex justify-between text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">
              <span>{t("dashboard.queue.legend")}</span>
              <span>{t("dashboard.queue.attention", { n: kpis.openAlerts })}</span>
            </div>
            {queue.length === 0 ? (
              <EmptyPanel message={t("dashboard.queue.empty")} />
            ) : (
              <>
                {queue.map((q) => (
                  <PriorityQueueItem
                    key={q.resultId ?? q.patientId}
                    href={`/results/${q.resultId ?? q.patientId}`}
                    initials={q.initials}
                    name={q.name}
                    reason={t(`rules.${q.reason.rule}`, q.reason.rule === "missed_tests" ? { count: countWord(q.reason.count, locale) } : (q.reason as never))}
                    meta={t("dashboard.queue.detail", { when: `${formatShortDate(q.at, locale)} · ${formatTime(q.at, locale)}`, conf: Math.round(q.confidence * 100), quality: t(`quality.${q.quality}`), judgment: t(`judgment.${q.judgment}`) })}
                    band={q.band}
                    badge={`${q.riskIndex} · ${bandLabel(q.band)}`}
                  />
                ))}
                <div><Button href="/patients?filter=review">{t("dashboard.queue.reviewAll", { n: kpis.resultsToReview })}</Button></div>
              </>
            )}
            <p className="text-[11px] leading-[1.45] text-cobalt">{t("dashboard.queue.disclaimer")}</p>
          </Card>
          <Card>
            <CardHeading title={t("dashboard.activity.title")} description={t("dashboard.activity.subtitle")} />
            {activity.length === 0 ? (
              <EmptyPanel message={t("dashboard.activity.empty")} />
            ) : (
              <ul className="flex flex-col gap-[18px]">
                {activity.map((a) => (
                  <ActivityRow
                    key={`${a.type}-${a.name}-${a.at}`}
                    type={a.type}
                    title={t(`dashboard.activity.${a.type}`, { name: a.name })}
                    detail={
                      a.type === "test_completed"
                        ? t("dashboard.activity.testDetail", { when: when(a.at), band: bandLabel(a.band), score: a.riskIndex, conf: Math.round(a.confidence * 100), quality: t(`quality.${a.quality}`), judgment: t(`judgment.${a.judgment}`) })
                        : a.type === "invite_accepted"
                          ? t("dashboard.activity.inviteDetail", { when: when(a.at) })
                          : t("dashboard.activity.planDetail", { when: when(a.at), frequency: t(`dashboard.activity.freq.${a.frequency}`) })
                    }
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          <Card>
            <CardHeading title={t("dashboard.distribution.title")} description={t("dashboard.distribution.subtitle", { n: activeTotal })} />
            {distribution.low + distribution.moderate + distribution.high === 0 ? (
              <EmptyPanel message={t("dashboard.distribution.empty")} />
            ) : (
              <RiskDistribution counts={{ low: distribution.low, moderate: distribution.moderate, high: distribution.high }} labels={{ low: bandLabel("low"), moderate: bandLabel("moderate"), high: bandLabel("high") }} />
            )}
            <p className="text-[11px] leading-[1.45] text-ink-muted">{t("dashboard.distribution.note", { n: distribution.noRecording })}</p>
          </Card>
          <FocusCard title={t("dashboard.focus.title")} line1={t("dashboard.focus.line1")} line2={t("dashboard.focus.line2")} body={t("dashboard.focus.body", { n: data.pendingActions })} cta={t("dashboard.focus.cta")} href="/alerts" />
        </div>
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
