"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Title } from "@/components/ui/title";
import { useT } from "@/lib/i18n/client";

export function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const schema = z.object({ email: z.string().email(t("signup.errors.email")), password: z.string().min(8, t("login.invalid")) });
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setPending(true);
    setFailed(false);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    setPending(false);
    if (!res.ok) return setFailed(true);
    router.push((await res.json()).next);
  }

  return (
    <form className="flex w-[420px] shrink-0 flex-col gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1">
        <Title as="h1" size={36} className="leading-[1.45]">{t("login.welcome")}</Title>
        <p className="text-[12px] leading-[1.45] text-ink-muted">{t("login.subtitle")}</p>
      </div>
      {failed && <Alert state="error" title={t("login.invalid")} />}
      <Field label={t("login.email")} type="email" autoComplete="username" placeholder="elena.morales@riverside.example" error={errors.email?.message} {...register("email")} />
      <Field label={t("login.password")} type="password" autoComplete="current-password" placeholder="••••••••••••••" error={errors.password?.message} {...register("password")} />
      <Link href="/login/reset" className="text-[13px] leading-[1.45] text-cobalt">{t("login.forgot")}</Link>
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="primary" type="submit" disabled={pending}>{t("login.submit")}</Button>
      </div>
      <p className="text-[13px] leading-[1.45] text-ink-muted">{t("login.newTo")} <Link href="/signup/account" className="text-cobalt">{t("login.create")}</Link></p>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("login.encrypted")}</p>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("login.demo")}</p>
    </form>
  );
}
