import { PageHeading } from "@/components/app/page-heading";
import { Card } from "@/components/ui/card";
import { accuracyReport } from "@/data/repositories/triage";
import { getT } from "@/lib/i18n/server";

export default async function AccuracyReport() {
  const { t } = await getT();
  const r = accuracyReport();
  const tile = (label: string, value: string | number, note?: string) => (
    <div className="flex flex-col gap-1 rounded-card bg-surface p-5"><p className="text-[12px] text-ink-muted">{label}</p><p className="font-display text-[32px] font-medium tracking-[-0.03em]">{value}</p>{note && <p className="text-[11px] text-ink-muted">{note}</p>}</div>
  );
  return (
    <>
      <PageHeading eyebrow={t("triage.reportSub", { n: r.triages })} title={t("triage.reportTitle")} action={{ label: t("triage.nav"), href: "/triage", variant: "secondary" }} />
      <Card tint className="gap-2 p-6">
        <p className="text-[13px] text-cobalt">{t("triage.per100")}</p>
        <p className="font-display text-[56px] font-medium leading-none tracking-[-0.04em]">{r.casesPer100}</p>
        <p className="text-[12px] text-ink-muted">{r.cases} / {r.recommendedMeasured} · {t("triage.referenceNote", { n: r.pumaReferencePer100 })}</p>
      </Card>
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        {tile(t("triage.completion"), `${r.completion}%`, `${r.measured} / ${r.due}`)}
        {tile(t("triage.noShows"), r.noShow)}
        {tile(t("triage.overrides"), r.overrides, t("triage.overridesNote", { m: r.overridesMeasured, c: r.overrideCases }))}
        {tile(t("triage.retriageDue"), r.retriageDue)}
      </div>
      <Card className="gap-3 p-6">
        <h2 className="text-[16px] font-medium">{t("triage.byCentre")}</h2>
        <ul className="flex flex-col">{r.byCentre.map((c) => <li key={c.centre} className="flex justify-between border-t border-line py-3 text-[13px]"><span>{c.centre}</span><span className="text-ink-muted">{c.cases} {t("triage.casesShort")} / {c.measured} {t("triage.measuredShort")}</span></li>)}</ul>
        <p className="text-[11px] text-ink-muted">{t("triage.patientReported")}: {r.patientReported}. {t("triage.reportFoot")}</p>
      </Card>
    </>
  );
}
