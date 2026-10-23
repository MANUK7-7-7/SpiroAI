import { BiometricPanel } from "@/components/auth/biometric-panel";
import { TabletShell } from "@/components/public/tablet-shell";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function Page() {
  await syncStore();
  const { t } = await getT();
  return (
    <TabletShell note={t("biometric.note")} padding="p-12" className="gap-12">
      <BiometricPanel />
    </TabletShell>
  );
}
