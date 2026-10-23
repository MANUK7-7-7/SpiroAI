import { ResetForm } from "@/components/auth/reset-form";
import { TabletShell } from "@/components/public/tablet-shell";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function Page() {
  await syncStore();
  const { t } = await getT();
  return (
    <TabletShell note={t("reset.note")}>
      <ResetForm />
    </TabletShell>
  );
}
