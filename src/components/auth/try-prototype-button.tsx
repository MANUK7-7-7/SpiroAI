"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

/** One tap into the demo workspace with fictional data, no account needed. */
export function TryPrototypeButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setPending(true);
    setFailed(false);
    const res = await fetch("/api/auth/demo", { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      setPending(false);
      return setFailed(true);
    }
    router.push((await res.json()).next);
  }

  return (
    <>
      <Button variant={variant} disabled={pending} onClick={start}>{t("welcome.tryPrototype")}</Button>
      {failed && <span role="alert" className="self-center text-[12px] text-risk-high">{t("welcome.tryPrototypeError")}</span>}
    </>
  );
}
