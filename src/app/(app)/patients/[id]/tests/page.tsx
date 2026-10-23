import { EmptyPanel } from "@/components/app/data-state";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { TestHistoryRow } from "@/components/profile/test-history-row";
import { Card, CardHeading } from "@/components/ui/card";
import { parseDemoState } from "@/data/demo-state";
import { listRecords } from "@/data/repositories/results";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";
import { ShowMore } from "@/components/profile/show-more";
import { syncStore } from "@/data/persist";

export default async function TestsTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const { id } = await params;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  const records = await listRecords(id, parseDemoState((await searchParams).state));
  const rows = records.map((rec) => <TestHistoryRow key={rec.result.id} rec={rec} t={t} locale={locale} />);
  return (
    <ProfileFrame patient={p.patient} tab="tests" alertCount={p.alerts.length}>
      <Card className="rounded-panel">
        <CardHeading title={t("tests.title")} description={t("tests.sub", { n: records.length })} />
        {records.length === 0 ? <EmptyPanel message={t("tests.empty")} action={t("profile.recordNow")} href={`/patients/${id}/record`} /> : <ShowMore initial={5} more={t("tests.showOlder")} less={t("tests.showLess")}>{rows}</ShowMore>}
        <p className="text-[12px] leading-[1.45] text-cobalt">{t("common.disclaimer")}</p>
      </Card>
    </ProfileFrame>
  );
}
