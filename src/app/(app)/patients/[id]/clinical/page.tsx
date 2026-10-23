import { EmptyPanel } from "@/components/app/data-state";
import { ClinicalRecord } from "@/components/profile/clinical-edit";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { formatDayYear } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";
import { syncStore } from "@/data/persist";

export default async function ClinicalTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const { id } = await params;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  return (
    <ProfileFrame patient={p.patient} tab="clinical" alertCount={p.alerts.length}>
      {p.clinical ? <ClinicalRecord patientId={id} data={p.clinical} meta={t("clinical.meta", { who: p.clinical.updatedBy, date: formatDayYear(`${p.clinical.updatedOn}T12:00:00-03:00`, locale) })} /> : <EmptyPanel message={t("clinical.error")} />}
    </ProfileFrame>
  );
}
