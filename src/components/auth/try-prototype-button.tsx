"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

/**
 * One tap into the demo with fictional data, no account needed.
 * `role="agent"` opens the health agent's phone view; the default opens the doctor's workspace.
 */
export function TryPrototypeButton({ variant = "primary", role = "doctor", next, label, className }: {
  variant?: "primary" | "secondary"; role?: "doctor" | "agent"; next?: string; label?: string; className?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setPending(true);
    setFailed(false);
    const res = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, next }) }).catch(() => null);
    if (!res?.ok) {
      setPending(false);
      return setFailed(true);
    }
    router.push((await res.json()).next);
  }

  return (
    <>
      <Button variant={variant} disabled={pending} onClick={start} className={className}>{label ?? t(role === "agent" ? "welcome.tryAgent" : "welcome.tryPrototype")}</Button>
      {failed && <span role="alert" className="self-center text-[12px] text-risk-high">{t("welcome.tryPrototypeError")}</span>}
    </>
  );
}
