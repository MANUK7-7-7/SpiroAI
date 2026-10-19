import { PageHeading } from "@/components/app/page-heading";
import { SettingsShell } from "@/components/settings/shell";
import { Button } from "@/components/ui/button";
import { Title } from "@/components/ui/title";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { getT } from "@/lib/i18n/server";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  const me = await getCurrentClinician();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-[12px] uppercase leading-[1.45] tracking-[0.06em] text-ink-muted">{t("settings.crumb", { clinic: me.institution.toUpperCase() })}</p>
          <Title size={30}>{t("settings.title")}</Title>
        </div>
        <Button href="/dashboard">{t("settings.back")}</Button>
      </div>
      <SettingsShell>{children}</SettingsShell>
    </div>
  );
}
