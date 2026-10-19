import { ResetForm } from "@/components/auth/reset-form";
import { TabletShell } from "@/components/public/tablet-shell";
import { getT } from "@/lib/i18n/server";

export default async function Page() {
  const { t } = await getT();
  return (
    <TabletShell note={t("reset.note")}>
      <ResetForm />
    </TabletShell>
  );
}
