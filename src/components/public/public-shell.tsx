import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { LocaleToggle } from "./locale-toggle";
import { getT } from "@/lib/i18n/server";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 rounded-shell bg-surface-sunken p-10">
      <header className="flex items-center justify-between">
        <Brand shape="pill" />
        <nav className="flex items-center gap-6">
          <span className="whitespace-nowrap text-[14px] tracking-[-0.005em] text-ink-muted">{t("public.forProfessionals")}</span>
          <LocaleToggle />
          <Button href="/login" radius="lg">{t("common.login")}</Button>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.footer")}</p>
    </div>
  );
}
