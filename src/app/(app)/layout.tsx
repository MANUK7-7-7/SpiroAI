import { IdleLogout } from "@/components/app/idle-logout";
import { Sidebar } from "@/components/app/sidebar";
import { TabletBottomTabs, TabletHeader } from "@/components/app/tablet";
import { Topbar } from "@/components/app/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-start gap-4 rounded-shell bg-surface-sunken p-6 lg:p-4">
      <IdleLogout />
      <div className="hidden lg:block"><Sidebar /></div>
      <div className="flex min-h-[calc(100vh-48px)] min-w-0 flex-1 flex-col gap-6 lg:min-h-0">
        <div className="hidden lg:block"><Topbar /></div>
        <TabletHeader />
        <main className="flex flex-1 flex-col gap-6 lg:px-3 lg:pb-5">{children}</main>
        <TabletBottomTabs />
      </div>
    </div>
  );
}
