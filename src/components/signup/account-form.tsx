"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { useSignupDraft } from "./use-draft";

export function passwordScore(pw: string) {
  const criteria = [pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  return pw ? criteria.filter(Boolean).length : 0;
}
const strengthIndex = (pw: string) => (pw.length < 8 ? 0 : passwordScore(pw) <= 1 ? 1 : passwordScore(pw) === 2 ? 2 : 4);

export function AccountForm() {
  const { t } = useT();
  const router = useRouter();
  const { draft, save, ready } = useSignupDraft();
  const schema = z.object({
    fullName: z.string().min(3, t("signup.errors.name")),
    email: z.string().email(t("signup.errors.email")),
    password: z.string().min(12, t("signup.errors.password")),
  });
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "" } });
  useEffect(() => { if (ready) reset({ fullName: draft.fullName, email: draft.email, password: "" }); }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const pw = watch("password") ?? "";
  const filled = passwordScore(pw);
  const idx = strengthIndex(pw);

  return (
    <Card>
      <CardHeading title={t("signup.account.title")} description={t("signup.stepOf", { n: 1 })} />
      <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit((v) => { save({ fullName: v.fullName, email: v.email }); router.push("/signup/professional"); })}>
        <Field label={t("signup.account.name")} placeholder={t("signup.account.namePh")} autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Field label={t("signup.account.email")} placeholder={t("signup.account.emailPh")} hint={t("signup.account.emailHint")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label={t("signup.account.password")} type="password" placeholder="••••••••••••••" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <div className="flex gap-[5px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => <div key={i} className={cn("h-[5px] flex-1 rounded-md", i < filled ? "bg-cobalt" : "bg-line")} />)}
        </div>
        <p className="text-[11px] leading-[1.45] text-cobalt" aria-live="polite">{pw ? t(`signup.account.strength.${idx}`) : ""}</p>
        <div className="flex items-start justify-between">
          <Button href="/">{t("common.cancel")}</Button>
          <Button variant="primary" type="submit">{t("common.next")}</Button>
        </div>
      </form>
      <p className="text-[12px] leading-[1.45] text-ink-muted">{t("signup.already")} <Link href="/login" className="font-medium text-cobalt">{t("common.login")}</Link></p>
    </Card>
  );
}
