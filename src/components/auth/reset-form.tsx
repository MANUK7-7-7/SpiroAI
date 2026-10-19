"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useT } from "@/lib/i18n/client";

export function ResetForm() {
  const { t } = useT();
  const [sent, setSent] = useState(false);
  const schema = z.object({ email: z.string().email(t("signup.errors.email")) });
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  // The confirmation is identical whether or not the email is registered.
  return (
    <Card>
      <CardHeading title={t("reset.title")} description={t("reset.subtitle")} />
      <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit(() => setSent(true))}>
        <Field label={t("reset.email")} type="email" autoComplete="email" placeholder="elena.morales@riverside.example" error={errors.email?.message} {...register("email")} />
        <div><Button variant="primary" type="submit">{t("reset.submit")}</Button></div>
      </form>
      {sent && <Alert state="success" title={t("reset.sentTitle")}>{t("reset.sentBody")}</Alert>}
      <p className="text-[13px] leading-[1.45] text-cobalt">
        <Link href="/login">{t("reset.back")}</Link> · <button type="button" onClick={() => setSent(true)}>{t("reset.resend")}</button>
      </p>
    </Card>
  );
}
