"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { SettingsGuard } from "./section";

const items = ["profile", "notifications", "thresholds", "team", "security", "help"] as const;

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const path = usePathname();
  const router = useRouter();
  const current = items.find((k) => path.startsWith(`/settings/${k}`)) ?? "profile";
  return (
    <SettingsGuard section={t(`settings.nav.${current}`)}>
      {(request) => (
        <div className="flex gap-4 max-lg:flex-col">
          <aside className="flex h-fit w-[230px] p-[14px] shrink-0 flex-col gap-2 rounded-card bg-surface shadow-[inset_0_0_0_1px_var(--line)] max-lg:w-full">
            <nav aria-label={t("settings.title")} className="flex flex-col gap-1 max-lg:flex-row max-lg:flex-wrap">
              {items.map((key) => {
                const active = key === current;
                return (
                  <a key={key} href={`/settings/${key}`} aria-current={active ? "page" : undefined}
                    onClick={(e) => { if (active) return; e.preventDefault(); request(() => router.push(`/settings/${key}`)); }}
                    className={cn("flex h-[47px] items-center rounded-[18px] px-[14px] text-[13px] leading-[1.45]", active ? "bg-ink font-medium tracking-[-0.01em] text-on-accent" : "text-ink hover:bg-surface-soft")}>
                    {t(`settings.nav.${key}`)}
                  </a>
                );
              })}
            </nav>
            <Button size="sm" radius="lg" className="mt-2 self-start" onClick={() => request(async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; })}>{t("settings.logout")}</Button>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )}
    </SettingsGuard>
  );
}
