"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/** Leaves the health-agent demo and goes back to the landing page. */
export function ExitDemo() {
  const { t } = useT();
  const router = useRouter();
  async function exit() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={exit} aria-label={t("agent.exit")} title={t("agent.exit")}
      className="flex size-9 items-center justify-center rounded-full bg-surface text-ink-muted hover:text-ink">
      <LogOut size={16} aria-hidden />
    </button>
  );
}
