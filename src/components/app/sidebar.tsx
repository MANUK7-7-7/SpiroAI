import { Hospital, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Brand } from "@/components/ui/brand";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { getT } from "@/lib/i18n/server";
import { SidebarNav } from "./sidebar-nav";

export async function Sidebar() {
  const [{ t }, me] = await Promise.all([getT(), getCurrentClinician()]);
  return (
    <aside className="flex min-h-[1028px] w-[204px] shrink-0 flex-col gap-[30px] self-stretch rounded-panel bg-surface p-[18px]">
      <Brand shape="pill" />
      <p className="text-[10px] font-medium leading-[1.45] tracking-[0.06em] text-ink-muted">{t("app.workspace")}</p>
      <SidebarNav
        alertCount={me.unreadAlerts}
        items={[
          { href: "/dashboard", icon: "dashboard", label: t("app.nav.dashboard") },
          { href: "/patients", match: ["/patients", "/results"], icon: "patients", label: t("app.nav.patients") },
          { href: "/alerts", icon: "alerts", label: t("app.nav.alerts"), badge: me.unreadAlerts },
          { href: "/messages", icon: "messages", label: t("app.nav.messages") },
          { href: "/settings/profile", match: "/settings", icon: "settings", label: t("app.nav.settings") },
        ]}
      />
      <div className="flex flex-col gap-2 rounded-[24px] bg-cobalt-tint p-[14px]">
        <Hospital size={20} strokeWidth={1.8} className="text-cobalt" aria-hidden />
        <p className="text-[12px] font-medium leading-[1.45] tracking-[-0.01em]">{me.institution}</p>
        <p className="text-[11px] leading-[1.45] text-ink-muted">{t("app.clinic")}</p>
      </div>
      <div className="flex flex-col gap-3 pt-[160px]">
        <ShieldCheck size={20} strokeWidth={1.8} className="text-cobalt" aria-hidden />
        <p className="text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("app.principle.0")}<br />{t("app.principle.1")}</p>
      </div>
      <div className="flex items-center gap-[9px] pt-5">
        <Avatar initials={me.initials} />
        <div className="min-w-0 flex-1 leading-[1.45]">
          <p className="truncate text-[12px] font-medium tracking-[-0.01em]">{me.fullName}</p>
          <p className="text-[10px] text-cobalt">{me.verified ? t("app.verified") : ""}</p>
        </div>
      </div>
    </aside>
  );
}
