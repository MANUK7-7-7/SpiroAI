import { notFound } from "next/navigation";
import { EmptyPanel } from "@/components/app/data-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Title } from "@/components/ui/title";
import { metricCatalog, metricOrder } from "@/config/metrics";
import { listRecords, reviewLabelKey, type ResultView } from "@/data/repositories/results";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";
import type { MetricId } from "@/ai/contracts";
import { syncStore } from "@/data/persist";

type SP = Record<string, string | string[] | undefined>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);
const keyOf = { f0: "f0Hz", jitter: "jitterPct", shimmer: "shimmerPct", hnr: "hnrDb", mpt: "mptSec" } as const;
const fmt = (m: MetricId, v: number) => `${v.toFixed(metricCatalog[m].decimals)}${metricCatalog[m].unit === "%" ? "%" : ` ${metricCatalog[m].unit}`}`;

export default async function ComparePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await syncStore();
  const { id } = await params;
  const sp = await searchParams;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  const all = (await listRecords(id)).filter((r) => r.result.status === "ready");
  const byId = new Map(all.map((r) => [r.result.id, r]));
  // Oldest on the left, newest on the right.
  const [b, a] = [byId.get(one(sp.b) ?? "") ?? all[0], byId.get(one(sp.a) ?? "") ?? all[1]];
  if (!a || !b) return <EmptyPanel message={t("compare.notEnough")} action={t("compare.back")} href={`/patients/${id}/trends`} />;
  const [left, right] = Date.parse(a.result.createdAt) <= Date.parse(b.result.createdAt) ? [a, b] : [b, a];
  const delta = right.result.riskIndex! - left.result.riskIndex!;
  const devs = right.result.deviations ?? [];
  const names = (ms: MetricId[]) => ms.map((m) => t(`result.metricNames.${m}`)).join(` ${t("compare.and")} `);
  const upM = devs.filter((d) => d.flag === "deviation" && d.baseline !== undefined && d.value > d.baseline).map((d) => d.metric).filter((m) => metricCatalog[m].worse !== "lower");
  const downM = devs.filter((d) => d.flag === "deviation" && d.baseline !== undefined && d.value < d.baseline).map((d) => d.metric).filter((m) => metricCatalog[m].worse === "lower");
  const sentences = [
    delta > 0 ? t("compare.riskUp", { n: delta }) : delta < 0 ? t("compare.riskDown", { n: Math.abs(delta) }) : t("compare.riskSame"),
    upM.length ? t("compare.above", { list: names(upM), verb: t(upM.length > 1 ? "compare.are" : "compare.is") }) : "",
    downM.length ? t("compare.below", { list: names(downM), verb: t(downM.length > 1 ? "compare.are" : "compare.is") }) : "",
    t("compare.review"),
  ].filter(Boolean).join(" ");
  const goodCount = all.filter((r) => r.result.quality?.level !== "poor").length;
  const showBuilding = goodCount < 3 || one(sp.state) === "baseline";

  const column = (rec: ResultView) => {
    const r = rec.result;
    const label = reviewLabelKey(rec);
    return (
      <Card key={r.id} className="min-w-0 flex-1 rounded-panel">
        <CardHeading title={formatDateTime(r.createdAt, locale)} description={t("compare.protocol")} />
        <div><RiskBadge band={r.band!} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} /></div>
        <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45]">
          <div className="flex flex-wrap gap-5 text-ink-muted"><p>{t("overview.confidence", { n: Math.round((r.confidence ?? 0) * 100) })}</p><p>{t("overview.quality", { q: t(`quality.${r.quality?.level ?? "good"}`) })}</p></div>
          <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
          <p className="text-ink-muted">{t("overview.final", { j: t(label.key, label.vars) })}</p>
        </div>
        <div className="flex flex-col gap-[18px]">
          {metricOrder.map((m) => (
            <div key={m} className="flex items-center justify-between rounded-[16px] bg-surface-soft px-4 py-[14px] text-[14px] leading-[1.45]">
              <span>{t(`result.metricNames.${m}`)}</span><span className="font-mono">{fmt(m, r.features![keyOf[m]] as number)}</span>
            </div>
          ))}
        </div>
        <div><Button href={`/results/${r.id}`}>{t("compare.open")}</Button></div>
      </Card>
    );
  };
  if (!p.patient) notFound();

  return (
    <>
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-[12px] leading-[1.45] text-ink-muted">{t("compare.crumb", { name: p.patient.name.toUpperCase(), code: p.patient.code })}</p>
          <Title size={30}>{t("compare.title")}</Title>
        </div>
        <Button href={`/patients/${id}/trends`}>{t("compare.back")}</Button>
      </div>
      <Alert title={t("compare.alertTitle")}>{t("compare.alertBody")}</Alert>
      <div className="flex items-start gap-6">{column(left)}{column(right)}</div>
      <div className="flex items-start gap-6">
        <Card className="min-w-0 flex-1 rounded-panel">
          <CardHeading title={t("compare.changedTitle")} />
          <p className="text-[15px] leading-[1.45] tracking-[-0.005em]">{sentences}</p>
          <div><Button variant="primary" href="?panel=action">{t("result.action")}</Button></div>
        </Card>
        {showBuilding && (
          <Card className="min-w-0 flex-1 rounded-panel">
            <CardHeading title={t("compare.buildingTitle")} />
            <Alert state="warning" title={t("compare.buildingAlert")}>{t("compare.buildingBody", { n: all.length })}</Alert>
            <div><Button href={`/patients/${id}/tests?action=request`}>{t("compare.requestNext")}</Button></div>
          </Card>
        )}
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
