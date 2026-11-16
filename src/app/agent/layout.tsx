import { Brand } from "@/components/ui/brand";
import { ExitDemo } from "@/components/agent/exit-demo";
import { getT } from "@/lib/i18n/server";

/** Phone view of a health agent on home visits. On a computer it stays phone-width, centred. */
export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col gap-5 px-4 pb-8 pt-4">
        <header className="flex items-center justify-between gap-3">
          <Brand />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cobalt-tint px-3 py-1.5 text-[12px] font-medium text-cobalt">{t("agent.badge")}</span>
            <ExitDemo />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
