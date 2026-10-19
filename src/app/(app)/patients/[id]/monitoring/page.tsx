import { EmptyPanel } from "@/components/app/data-state";
import { PlanForm } from "@/components/profile/plan-form";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";

export default async function MonitoringPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const { t } = await getT();
  const p = await loadProfile(id, searchParams);
  return (
    <ProfileFrame patient={p.patient} tab={null} crumb={t("plan.crumb", { name: p.patient.name.toUpperCase(), code: p.patient.code })} title={t("plan.title")} alertCount={p.alerts.length} headingAction={<Button href={`/patients/${id}`}>{t("plan.back")}</Button>}>
      {p.plan ? <PlanForm patientId={id} plan={p.plan} defaultFrequency={p.patient.status === "diagnosed" ? "weekly" : "biweekly"} /> : <EmptyPanel message={t("plan.noPlan")} />}
    </ProfileFrame>
  );
}
