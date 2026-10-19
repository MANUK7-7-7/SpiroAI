import { EmptyPanel } from "@/components/app/data-state";
import { MetricTrend, type MetricSeries } from "@/components/charts/metric-trend";
import { RiskTrend } from "@/components/charts/risk-trend";
import { EventForm } from "@/components/profile/forms";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { DEMO_NOW } from "@/config/demo";
import { metricOrder } from "@/config/metrics";
import { formatDateTime, formatDayYear } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";

export default async function TrendsTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  const records = (p.history?.records ?? []).filter((r) => r.result.status === "ready");
  const now = Date.parse(DEMO_NOW);
  const items = records.map((r) => ({ id: r.result.id, t: Date.parse(r.result.createdAt), v: r.result.riskIndex!, when: formatDateTime(r.result.createdAt, locale), band: r.result.band!, excluded: r.result.quality?.level === "poor" }));
  const series = p.history ? (Object.fromEntries(metricOrder.map((m) => {
    const key = ({ f0: "f0Hz", jitter: "jitterPct", shimmer: "shimmerPct", hnr: "hnrDb", mpt: "mptSec" } as const)[m];
    const b = p.history!.baseline.metrics[m]!;
    return [m, { baseline: b.mean, sd: b.sd, points: records.filter((r) => r.result.quality?.level !== "poor").map((r) => ({ id: r.result.id, t: Date.parse(r.result.createdAt), v: r.result.features![key] as number, when: formatDateTime(r.result.createdAt, locale) })) }];
  })) as MetricSeries) : undefined;
  const first = items.length ? Math.min(...items.map((i) => i.t)) : now;
  const compare = records.length >= 2 ? `/patients/${id}/compare?a=${records[records.length - 2].result.id}&b=${records[records.length - 1].result.id}` : undefined;

  return (
    <ProfileFrame patient={p.patient} tab="trends" title={t("trends.title")} alertCount={p.alerts.length} headingAction={<Button href="?modal=export">{t("trends.export")}</Button>}>
      <Card className="rounded-panel">
        <CardHeading title={t("trends.riskTitle")} description={t("trends.riskSub")} />
        {items.length === 0 || !p.history ? (
          <EmptyPanel message={t("trends.empty")} />
        ) : (
          <RiskTrend items={items} baseline={p.history.baselineBand} now={now} patientName={p.patient.name} variant="full"
            controls={<div className="flex gap-2"><Button size="sm" href={compare}>{t("trends.compare")}</Button></div>} />
        )}
        {p.events.length > 0 && (
          <ul className="flex flex-wrap gap-3" aria-label={t("trends.addEvent")}>
            {[...p.events].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <li key={e.id} className="flex flex-col gap-1 rounded-[16px] bg-surface-soft px-4 py-3 text-[11px] leading-[1.45]">
                <span className="font-medium text-cobalt">● {formatDayYear(`${e.date}T12:00:00-03:00`, locale).replace(/\s\d{4}$/, "")}</span>
                <span>{t(`trends.marker.${e.type}`)}{e.detail ? ` · ${e.detail}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
        {records.length > 0 && (
          <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45]">
            <div className="flex flex-wrap gap-5 text-ink-muted"><p>{t("overview.confidence", { n: Math.round((records[records.length - 1].result.confidence ?? 0) * 100) })}</p><p>{t("overview.quality", { q: t(`quality.${records[records.length - 1].result.quality?.level ?? "good"}`) })}</p></div>
            <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
          </div>
        )}
      </Card>
      <div className="flex items-start gap-6">
        <Card className="min-w-0 flex-1 rounded-panel">
          <CardHeading title={t("trends.metricsTitle")} description={t("trends.metricsSub")} />
          {series && items.length ? <MetricTrend series={series} from={Math.min(first, now - 76 * 86_400_000)} to={now} /> : <EmptyPanel message={t("trends.empty")} />}
        </Card>
        <div className="w-[350px] shrink-0"><EventForm patientId={id} defaultDate={DEMO_NOW.slice(0, 10)} /></div>
      </div>
    </ProfileFrame>
  );
}
