"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/lib/i18n/client";
import { AlreadyHaveAccount } from "./already";
import { useSignupDraft } from "./use-draft";

export function TermsForm() {
  const { t } = useT();
  const router = useRouter();
  const { draft, clear } = useSignupDraft();
  const [accepted, setAccepted] = useState([false, false, false]);
  const [tried, setTried] = useState(false);
  const keys = ["tos", "dpa", "medical"] as const;
  const links = [0, 1, 2].map((i) => t(`signup.terms.links.${i}`));

  function submit() {
    if (!accepted.every(Boolean)) return setTried(true);
    clear();
    router.push("/verification-pending");
  }

  return (
    <Card>
      <CardHeading title={t("signup.terms.title")} description={t("signup.stepOf", { n: 3 })} />
      <Alert title={t("signup.terms.alertTitle")}>{t("signup.terms.alertBody")}</Alert>
      {keys.map((k, i) => (
        <Checkbox key={k} label={t(`signup.terms.${k}`)} checked={accepted[i]} error={tried && !accepted[i] ? t("signup.terms.mustAccept") : undefined}
          onCheckedChange={(v) => setAccepted((a) => a.map((x, j) => (j === i ? v : x)))} />
      ))}
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] leading-[1.45] tracking-[-0.005em] text-ink-muted">
        {links.map((l) => <Link key={l} href="#" className="hover:text-ink">{l}</Link>)}
      </p>
      <Card tint>
        <CardHeading title={t("signup.terms.readyTitle")} />
        <div className="text-[13px] leading-[1.45] tracking-[-0.005em] text-ink">
          <p>{(draft.fullName || "Elena Morales").replace(/^Dra?\.\s*/, "")} · {draft.specialty || t("signup.professional.specialties.0")}</p>
          <p>{draft.institution || "Riverside Clinic"} · {draft.license || "MP-48291"}</p>
          <p>{draft.email || "elena.morales@riverside.example"}</p>
        </div>
      </Card>
      <div className="flex items-start justify-between">
        <Button href="/signup/professional">{t("common.back")}</Button>
        <Button variant="primary" onClick={submit}>{t("signup.terms.submit")}</Button>
      </div>
      <AlreadyHaveAccount />
    </Card>
  );
}
