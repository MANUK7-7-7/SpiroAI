import { IdleLogout } from "@/components/app/idle-logout";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-start gap-4 rounded-shell bg-surface-sunken p-4">
      <IdleLogout />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Topbar />
        <main className="flex flex-col gap-6 px-3 pb-5">{children}</main>
      </div>
    </div>
  );
}
