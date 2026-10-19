import { Plus } from "lucide-react";
import { EmptyPanel } from "@/components/app/data-state";
import { PageHeading } from "@/components/app/page-heading";
import { PatientCard } from "@/components/patients/patient-card";
import { PatientRow, patientColumns } from "@/components/patients/patient-row";
import { Pagination } from "@/components/patients/pagination";
import { PatientsToolbar } from "@/components/patients/patients-toolbar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { parseDemoState } from "@/data/demo-state";
import { listPatients, type PatientQuery } from "@/data/repositories/patients";
import { getT } from "@/lib/i18n/server";

type SP = Record<string, string | string[] | undefined>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);

export default async function PatientsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const query: PatientQuery = {
    q: one(sp.q), risk: one(sp.risk) as PatientQuery["risk"], status: one(sp.status) as PatientQuery["status"],
    gold: one(sp.gold) ? Number(one(sp.gold)) : undefined, last: one(sp.last) as PatientQuery["last"], invite: one(sp.invite) === "1",
    filter: one(sp.filter) as PatientQuery["filter"], sort: one(sp.sort) as PatientQuery["sort"], page: Number(one(sp.page) ?? 1),
  };
  const demo = parseDemoState(sp.state);
  const data = await listPatients(query, demo);
  const filtered = Object.entries(query).some(([k, v]) => v && !["page", "sort"].includes(k));
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hrefFor = (page: number) => {
    const next = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    next.set("page", String(page));
    return `/patients?${next.toString()}`;
  };
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;

  return (
    <>
      <PageHeading
        eyebrow={<><span className="hidden lg:inline">{t("patients.eyebrow", { active: data.counts.active, invites: data.counts.invitesPending })}</span><span className="lg:hidden">{t("tablet.workspaceCount", { n: data.counts.active + data.counts.invitesPending })}</span></>}
        title={t("patients.title")}
        action={{ label: t("patients.add"), href: "/patients/new", icon: <Plus size={16} strokeWidth={2} aria-hidden /> }}
      />
      <div className="flex flex-col gap-4 lg:hidden">
        <PatientsToolbar variant="tablet" />
        {data.items.length === 0 ? <EmptyPanel message={filtered ? t("patients.empty") : t("patients.emptyPanel")} action={filtered ? t("patients.emptyAction") : t("patients.emptyPanelAction")} href={filtered ? "/patients" : "/patients/new"} /> : data.items.map((p) => <PatientCard key={p.id} p={p} t={t} locale={locale} />)}
        <Pagination page={data.page} pageCount={pageCount} hrefFor={hrefFor} labels={{ prev: t("patients.prev"), next: t("patients.next") }} summary={t("patients.showing", { from, to: Math.min(data.page * data.pageSize, data.total), total: data.total })} />
        <p className="text-[11px] leading-[1.45] text-ink-muted">{t("tablet.bottomNote")}</p>
      </div>
      <Card className="hidden lg:flex">
        <PatientsToolbar />
        <div className="flex flex-col">
          <div className={cn(patientColumns, "px-3 py-[14px] text-[11px] font-medium leading-[1.45] text-ink-muted bg-surface-soft")}>
            <p>{t("patients.cols.patient")}</p><p>{t("patients.cols.status")}</p><p>{t("patients.cols.risk")}</p><p>{t("patients.cols.trend")}</p><p>{t("patients.cols.last")}</p><p>{t("patients.cols.adherence")}</p><p />
          </div>
          {data.items.length === 0 ? (
            <div className="pt-4">
              <EmptyPanel message={filtered ? t("patients.empty") : t("patients.emptyPanel")} action={filtered ? t("patients.emptyAction") : t("patients.emptyPanelAction")} href={filtered ? "/patients" : "/patients/new"} />
            </div>
          ) : (
            data.items.map((p) => <PatientRow key={p.id} p={p} t={t} locale={locale} />)
          )}
        </div>
        <Pagination page={data.page} pageCount={pageCount} hrefFor={hrefFor} labels={{ prev: t("patients.prev"), next: t("patients.next") }} summary={t("patients.showing", { from, to: Math.min(data.page * data.pageSize, data.total), total: data.total })} />
        <p className="text-[11px] leading-[1.45] text-ink-muted">{t("patients.hint")}</p>
      </Card>
      <p className="text-[12px] leading-[1.45] text-cobalt">{t("patients.disclaimer")}</p>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
