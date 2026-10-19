import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { EmptyPanel } from "@/components/app/data-state";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { RiskTrend } from "@/components/charts/risk-trend";
import { DEMO_NOW } from "@/config/demo";
import { reviewLabelKey } from "@/data/repositories/results";
import { formatDateTime, formatDay, formatDayYear, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";

export default async function Overview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  const { patient, latest, plan, alerts, history } = p;
  const r = latest?.result;
  const label = latest ? reviewLabelKey(latest) : undefined;
  const items = (history?.records ?? []).filter((x) => x.result.status === "ready").map((x) => ({ id: x.result.id, t: Date.parse(x.result.createdAt), v: x.result.riskIndex!, when: formatDateTime(x.result.createdAt, locale), band: x.result.band!, excluded: x.result.quality?.level === "poor" }));
  const previous = history && history.records.length > 1 ? history.records[history.records.length - 2].result : undefined;
  const delta = r && previous ? (r.riskIndex ?? 0) - (previous.riskIndex ?? 0) : undefined;
  const freq = plan ? t("overview.freqLine", { freq: t(`overview.freq.${plan.frequency}`), sens: t(`overview.sens.${plan.sensitivity}`) }) : "";

  return (
    <ProfileFrame patient={patient} tab="overview" alertCount={alerts.length}>
      <div className="flex items-start gap-6">
        <Card className="min-w-0 flex-1 rounded-panel">
          <CardHeading title={t("overview.latestTitle")} description={r ? t("overview.latestMeta", { when: formatDateTime(r.createdAt, locale), code: latest!.testCode }) : undefined} />
          {!r ? (
            <EmptyPanel message={t("profile.noRecordings")} action={t("profile.recordNow")} href={`/patients/${patient.id}/record`} />
          ) : r.status !== "ready" ? (
            <Alert state={r.status === "failed" ? "error" : "warning"} title={t(r.status === "failed" ? "overview.failed" : r.status === "rejected_quality" ? "overview.rejected" : r.unavailable ? "overview.unavailable" : "overview.pending")} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <p className="whitespace-nowrap font-display text-[44px] font-medium leading-[1.2] tracking-[-0.05em]">{r.riskIndex} / 100</p>
                <RiskBadge band={r.band!} label={t(`risk.${r.band}`)} />
                {delta !== undefined && <span className="rounded-full bg-surface-soft px-[13px] py-2 text-[12px] leading-[1.45]">{t("overview.vsPrevious", { arrow: delta >= 0 ? "↑" : "↓", n: Math.abs(delta) })}</span>}
              </div>
              <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45]">
                <div className="flex flex-wrap gap-5 text-ink-muted"><p>{t("overview.confidence", { n: Math.round((r.confidence ?? 0) * 100) })}</p><p>{t("overview.quality", { q: t(`quality.${r.quality?.level ?? "good"}`) })}</p></div>
                <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
                <p className="text-ink-muted">{t("overview.final", { j: t(label!.key, label!.vars) })}</p>
                {r.isDemoModel && <p className="w-fit rounded-full bg-cobalt-tint px-[10px] py-1 text-[11px] font-medium text-cobalt">{t("result.demoModel")}</p>}
              </div>
              <div className="flex gap-3">
                <Button variant="primary" href={`/results/${r.id}`}>{t("overview.review")}</Button>
                <Button href={`/patients/${patient.id}/trends`}>{t("overview.seeTrend")}</Button>
              </div>
            </>
          )}
        </Card>
        <Card className="w-[340px] shrink-0 rounded-panel">
          <CardHeading title={t("overview.planTitle")} />
          {plan ? (
            <>
              <p className="font-display text-[30px] font-medium leading-[1.2] tracking-[-0.04em]">{Math.round((plan.adherence.done / plan.adherence.scheduled) * 100)}%</p>
              <p className="text-[12px] leading-[1.45] text-ink-muted">{t("overview.adherence", { done: plan.adherence.done, total: plan.adherence.scheduled })}</p>
              <p className="text-[14px] font-medium leading-[1.45] tracking-[-0.01em]">{t("overview.nextTest", { when: `${formatDay(plan.nextTestAt, locale)}, ${formatTime(plan.nextTestAt, locale)}` })}</p>
              <div className="text-[13px] leading-[1.45] text-ink-muted"><p>{freq}</p><p>{t("overview.planReview", { date: formatDayYear(`${plan.reviewOn}T12:00:00-03:00`, locale) })}</p></div>
            </>
          ) : (
            <p className="text-[12px] text-ink-muted">{t("profile.noRecordings")}</p>
          )}
          <div><Button size="sm" href={`/patients/${patient.id}/monitoring`}>{t("profile.editPlan")}</Button></div>
        </Card>
      </div>
      <div className="grid grid-cols-2 items-start gap-6">
        <Card className="rounded-panel">
          <CardHeading title={t("overview.alertsTitle", { n: alerts.length })} />
          {alerts.length === 0 && <p className="text-[12px] text-ink-muted">{t("overview.noAlerts")}</p>}
          {alerts.map((a) => {
            const params = { ...a.params, time: formatTime(a.firedAt, locale) } as Record<string, string | number>;
            return (
              <Alert key={a.id} state={a.severity === "high" ? "error" : "warning"} title={t(`alerts.rule.${a.rule}.title`, params)}>{t(`alerts.rule.${a.rule}.body`, params)}</Alert>
            );
          })}
          <div><Button href="?panel=action">{t("overview.takeAction")}</Button></div>
        </Card>
        <Card className="rounded-panel">
          <CardHeading title={t("overview.glance")} description={t("overview.glanceSub")} />
          {items.length ? <RiskTrend items={items} baseline={history!.baselineBand} now={Date.parse(DEMO_NOW)} patientName={patient.name} variant="glance" /> : <p className="text-[12px] text-ink-muted">{t("trends.empty")}</p>}
        </Card>
      </div>
    </ProfileFrame>
  );
}
