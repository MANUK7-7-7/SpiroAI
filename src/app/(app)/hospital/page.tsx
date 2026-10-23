import { EmptyPanel } from "@/components/app/data-state";
import { PageHeading } from "@/components/app/page-heading";
import { HospitalEntry } from "@/components/triage/triage-actions";
import { DEMO_NOW } from "@/config/demo";
import { parseDemoState } from "@/data/demo-state";
import { hospitalAppointments } from "@/data/repositories/triage";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

/** Technician view. The triage priority is never shown here, so each result is entered blind. */
export default async function HospitalPanel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t, locale } = await getT();
  const list = await hospitalAppointments(parseDemoState((await searchParams).state));
  const now = Date.parse(DEMO_NOW);
  const upcoming = list.filter((a) => Date.parse(a.at) >= now).reverse();
  const past = list.filter((a) => Date.parse(a.at) < now);
  const row = (a: (typeof list)[number]) => (
    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
      <div className="leading-[1.45]"><p className="text-[14px] font-medium">{a.patientName} · <span className="font-mono text-[12px] text-ink-muted">{a.code}</span></p><p className="text-[12px] text-ink-muted">{formatDateTime(a.at, locale)} · {a.centre}</p></div>
      {a.spirometry ? <p className="text-[13px] text-ink-muted">{a.spirometry.status === "no_show" ? t("triage.status.noShow") : a.spirometry.ratio !== undefined ? t("triage.ratio", { r: a.spirometry.ratio }) : t("triage.patientReported")}</p>
        : Date.parse(a.at) < now ? <HospitalEntry id={a.id} /> : null}
    </li>
  );
  return (
    <>
      <PageHeading eyebrow={t("triage.navHospital").toUpperCase()} title={t("triage.hospitalTitle")} />
      <p className="text-[13px] text-ink-muted">{t("triage.hospitalSub")}</p>
      {list.length === 0 ? <EmptyPanel message={t("triage.empty")} /> : (
        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <section className="rounded-card bg-surface p-5"><h2 className="pb-2 text-[16px] font-medium">{t("triage.upcoming")} · {upcoming.length}</h2><ul>{upcoming.map(row)}</ul></section>
          <section className="rounded-card bg-surface p-5"><h2 className="pb-2 text-[16px] font-medium">{t("triage.past")} · {past.length}</h2><ul>{past.map(row)}</ul></section>
        </div>
      )}
    </>
  );
}
