import Link from "next/link";
import { EmptyPanel } from "@/components/app/data-state";
import { PageHeading } from "@/components/app/page-heading";
import { PriorityBadge } from "@/components/triage/priority-badge";
import { Button } from "@/components/ui/button";
import { DEMO_NOW } from "@/config/demo";
import { puma } from "@/config/triage";
import { parseDemoState } from "@/data/demo-state";
import { accuracyReport, listTriages, type TriageView } from "@/data/repositories/triage";
import { formatDayYear, formatShortDate } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function TriagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const { t, locale } = await getT();
  const list = await listTriages(parseDemoState((await searchParams).state));
  const r = accuracyReport();
  const week = list.filter((x) => Date.parse(DEMO_NOW) - Date.parse(x.at) < 7 * 86_400_000).length;
  const status = (x: TriageView) => x.spirometry
    ? x.spirometry.status === "no_show" ? t("triage.status.noShow") : t("triage.status.result", { r: x.spirometry.obstruction ? t("triage.obstruction") : t("triage.noObstruction") })
    : x.referral ? t("triage.status.booked", { date: formatShortDate(x.referral.at, locale) })
    : x.retriageOn ? t("triage.status.retriage", { date: formatDayYear(`${x.retriageOn}T12:00:00-03:00`, locale) })
    : t("triage.status.open");
  const kpis = [[t("triage.kpi.week"), week], [t("triage.kpi.referred"), r.referred], [t("triage.kpi.measured"), r.measured], [t("triage.kpi.per100"), r.casesPer100]] as const;
  return (
    <>
      <PageHeading eyebrow={t("triage.eyebrow", { n: list.length })} title={t("triage.title")} action={{ label: t("triage.new"), href: "/triage/new" }} />
      <div className="flex flex-wrap gap-[10px]"><Button size="sm" radius="lg" href="/triage/report">{t("triage.report")}</Button><Button size="sm" radius="lg" href="/hospital">{t("triage.hospital")}</Button></div>
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        {kpis.map(([label, n]) => <div key={label} className="flex flex-col gap-1 rounded-card bg-surface p-5"><p className="text-[12px] text-ink-muted">{label}</p><p className="font-display text-[32px] font-medium tracking-[-0.03em]">{n}</p></div>)}
      </div>
      {list.length === 0 ? <EmptyPanel message={t("triage.empty")} action={t("triage.new")} href="/triage/new" /> : (
        <div className="overflow-x-auto rounded-card bg-surface p-4">
          <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
            <thead><tr className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">{(["person", "centre", "date", "puma", "voice", "priority", "status"] as const).map((c) => <th key={c} scope="col" className="px-3 py-2 font-medium">{t(`triage.cols.${c}`)}</th>)}</tr></thead>
            <tbody>
              {list.slice(0, 40).map((x) => (
                <tr key={x.id} className="border-t border-line">
                  <td className="px-3 py-3"><Link href={`/triage/${x.id}`} className="font-medium text-ink hover:text-cobalt">{x.patientName}</Link><p className="text-[11px] text-ink-muted">{x.code}</p></td>
                  <td className="px-3 py-3 text-ink-muted">{x.centre}</td>
                  <td className="px-3 py-3 text-ink-muted">{formatShortDate(x.at, locale)}</td>
                  <td className="px-3 py-3 font-mono">{x.pumaScore}/{puma.max}</td>
                  <td className="px-3 py-3">{t(`triage.voice.${x.voiceState}`)}</td>
                  <td className="px-3 py-3"><PriorityBadge priority={x.priority} label={t(`triage.priority.${x.priority}`)} /></td>
                  <td className="px-3 py-3 text-ink-muted">{status(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
