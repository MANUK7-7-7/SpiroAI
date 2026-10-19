import { Bell, LayoutDashboard, MessageSquare, Search, Settings, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Brand } from "@/components/ui/brand";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { getT } from "@/lib/i18n/server";
import { TabletTabs } from "./tablet-tabs";

/** Tablet adaptation (below 1024px): top bar with search, and persistent bottom tabs instead of the sidebar. */
export async function TabletHeader() {
  const [{ t }, me] = await Promise.all([getT(), getCurrentClinician()]);
  return (
    <header className="flex flex-col gap-4 lg:hidden">
      <div className="flex items-center justify-between">
        <Brand shape="pill" />
        <Link href="/alerts" aria-label={`${t("app.notifications")}: ${me.unreadAlerts}`} className="relative">
          <Bell size={20} strokeWidth={1.8} aria-hidden />
          <span className="absolute -right-3 -top-2 flex size-4 items-center justify-center rounded-full bg-cobalt text-[9px] font-medium text-on-accent">{me.unreadAlerts}</span>
        </Link>
        <Link href="/settings/profile" aria-label={t("app.account")}><Avatar initials={me.initials} className="size-9" /></Link>
      </div>
      <form role="search" action="/patients" className="flex items-center gap-3 rounded-[20px] bg-surface px-5 py-[18px]">
        <Search size={18} strokeWidth={1.8} className="text-cobalt" aria-hidden />
        <input name="q" aria-label={t("patients.search")} placeholder={t("patients.search")} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-muted" />
      </form>
    </header>
  );
}

export async function TabletBottomTabs() {
  const { t } = await getT();
  return (
    <TabletTabs
      items={[
        { href: "/dashboard", match: ["/dashboard"], label: t("app.nav.dashboard"), icon: "dashboard" },
        { href: "/patients", match: ["/patients", "/results"], label: t("app.nav.patients"), icon: "patients" },
        { href: "/alerts", match: ["/alerts"], label: t("app.nav.alerts"), icon: "alerts" },
        { href: "/messages", match: ["/messages"], label: t("app.nav.messages"), icon: "messages" },
        { href: "/settings/profile", match: ["/settings"], label: t("app.nav.settings"), icon: "settings" },
      ]}
    />
  );
}
export { LayoutDashboard, MessageSquare, Settings, Users };
