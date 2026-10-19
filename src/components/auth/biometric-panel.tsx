"use client";

import { ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Title } from "@/components/ui/title";
import { useT } from "@/lib/i18n/client";

/**
 * Demo stub: checks that a platform authenticator exists, then continues to 2FA.
 * Real WebAuthn registration and assertion are added with Settings > Security.
 */
export function BiometricPanel() {
  const { t } = useT();
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const api = typeof window !== "undefined" ? window.PublicKeyCredential : undefined;
    if (!api?.isUserVerifyingPlatformAuthenticatorAvailable) return setAvailable(false);
    api.isUserVerifyingPlatformAuthenticatorAvailable().then(setAvailable, () => setAvailable(false));
  }, []);

  return (
    <div className="flex flex-col items-center gap-7 px-16 py-20 text-center">
      <ScanFace size={80} strokeWidth={1} className="text-cobalt" aria-hidden />
      <Title as="h1" size={34}>{t("biometric.title")}</Title>
      <p className="text-[14px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("biometric.body")}</p>
      <Button variant="primary" onClick={() => router.push("/login")} disabled={available === false}>{t("biometric.continue")}</Button>
      <Button href="/login">{t("biometric.password")}</Button>
      {available === false && <Alert state="warning" title={t("biometric.unavailable")} className="w-full text-left">{t("biometric.unavailableBody")}</Alert>}
      <Alert title={t("biometric.alertTitle")} className="w-full text-left">{t("biometric.alertBody")}</Alert>
    </div>
  );
}
