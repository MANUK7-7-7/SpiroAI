"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { OtpInput } from "@/components/ui/otp-input";
import { Tabs } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/client";

const CODE_LIFETIME_S = 60;

export function TwoFactorForm() {
  const { t } = useT();
  const router = useRouter();
  const [method, setMethod] = useState<"auth" | "sms">("auth");
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(false);
  const [error, setError] = useState<"wrong" | null>(null);
  const [left, setLeft] = useState(CODE_LIFETIME_S);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const time = `00:${String(left).padStart(2, "0")}`;
  const expired = left <= 0;

  async function verify() {
    if (code.length < 6 || expired) return;
    setPending(true);
    const res = await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, trustDevice: trust }) });
    setPending(false);
    if (!res.ok) return setError("wrong");
    router.push((await res.json()).next);
  }

  return (
    <div className="mx-auto w-[660px] py-[70px]">
      <Card>
        <CardHeading title={t("twofa.title")} description={method === "auth" ? t("twofa.subtitle") : t("twofa.subtitleSms")} />
        <Tabs label={t("twofa.title")} value={method} onChange={(m) => { setMethod(m); setCode(""); setError(null); setLeft(CODE_LIFETIME_S); }} tabs={[{ id: "auth", label: t("twofa.tabAuth") }, { id: "sms", label: t("twofa.tabSms") }]} />
        {error && <Alert state="error" title={t("twofa.wrong")} />}
        {expired && <Alert state="warning" title={t("twofa.expired")} />}
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} label={t("twofa.tabAuth")} invalid={!!error} />
        <Checkbox label={t("twofa.trust")} checked={trust} onCheckedChange={setTrust} />
        <p className="text-[12px] leading-[1.45] text-ink-muted">{t("twofa.trustNote")}</p>
        <div><Button variant="primary" disabled={code.length < 6 || expired || pending} onClick={verify}>{t("twofa.submit")}</Button></div>
        <button type="button" className="w-fit text-[13px] leading-[1.45] text-cobalt" onClick={() => { setMethod(method === "auth" ? "sms" : "auth"); setCode(""); setLeft(CODE_LIFETIME_S); }}>
          {method === "auth" ? t("twofa.useSms") : t("twofa.useAuth")}
        </button>
        <p className="text-[12px] leading-[1.45] text-ink-muted">
          <Link href="/login" className="text-cobalt">{t("twofa.back")}</Link> · {t("twofa.expires", { time })}
        </p>
        <p className="text-[11px] text-ink-muted">{t("twofa.demo")}</p>
      </Card>
    </div>
  );
}
