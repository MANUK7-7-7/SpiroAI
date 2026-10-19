import { EmptyPanel } from "@/components/app/data-state";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return <EmptyPanel message={t("profile.notFound")} action={t("app.nav.patients")} href="/patients" />;
}
