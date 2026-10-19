import { BiometricPanel } from "@/components/auth/biometric-panel";
import { TabletShell } from "@/components/public/tablet-shell";
import { getT } from "@/lib/i18n/server";

export default async function Page() {
  const { t } = await getT();
  return (
    <TabletShell note={t("biometric.note")} padding="p-12" className="gap-12">
      <BiometricPanel />
    </TabletShell>
  );
}
