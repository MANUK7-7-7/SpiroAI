import { Bell } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { getT } from "@/lib/i18n/server";
import { GlobalSearch } from "./global-search";

export async function Topbar() {
  const [{ t }, me] = await Promise.all([getT(), getCurrentClinician()]);
  return (
    <header className="flex h-[66px] shrink-0 items-center justify-between rounded-card bg-surface pl-6 pr-[13px]">
      <GlobalSearch placeholder={t("app.search")} />
      <div className="flex items-center gap-5">
        <p className="whitespace-nowrap text-[11px] leading-[1.45] text-cobalt">{t("app.sample")}</p>
        <Link href="/alerts" aria-label={`${t("app.notifications")}: ${me.unreadAlerts}`} className="relative flex size-5 items-center justify-center rounded-full bg-surface-soft">
          <Bell size={20} strokeWidth={1.8} aria-hidden />
          {me.unreadAlerts > 0 && (
            <span className="absolute -top-[2px] left-[26px] flex size-4 items-center justify-center rounded-full bg-cobalt text-[9px] font-medium leading-3 text-on-accent">{me.unreadAlerts}</span>
          )}
        </Link>
        <Link href="/settings/profile" aria-label={t("app.account")}><Avatar initials={me.initials} className="size-[34px]" /></Link>
      </div>
    </header>
  );
}
