"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useT } from "@/lib/i18n/client";
import { AlreadyHaveAccount } from "./already";
import { useSignupDraft } from "./use-draft";

export function ProfessionalForm() {
  const { t, locale } = useT();
  const router = useRouter();
  const { draft, save, ready } = useSignupDraft();
  const specialties = ["0", "1", "2", "3", "4"].map((i) => t(`signup.professional.specialties.${i}`));
  const countries = ["0", "1", "2", "3", "4"].map((i) => t(`signup.professional.countries.${i}`));
  const req = t("signup.errors.required");
  const schema = z.object({ license: z.string().min(4, req), specialty: z.string().min(1), institution: z.string().min(2, req), country: z.string().min(1), city: z.string().min(2, req) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { license: "", specialty: specialties[0], institution: "", country: countries[0], city: "" },
  });
  useEffect(() => {
    if (ready) reset({ license: draft.license, specialty: draft.specialty || specialties[0], institution: draft.institution, country: draft.country || countries[0], city: draft.city });
  }, [ready, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card>
      <CardHeading title={t("signup.professional.title")} description={t("signup.stepOf", { n: 2 })} />
      <form className="flex flex-col gap-[18px]" noValidate onSubmit={handleSubmit((v) => { save(v); router.push("/signup/terms"); })}>
        <Field label={t("signup.professional.license")} placeholder={t("signup.professional.licensePh")} hint={t("signup.professional.licenseHint")} error={errors.license?.message} {...register("license")} />
        <SelectField label={t("signup.professional.specialty")} options={specialties} {...register("specialty")} />
        <Field label={t("signup.professional.institution")} placeholder={t("signup.professional.institutionPh")} error={errors.institution?.message} {...register("institution")} />
        <div className="flex gap-4">
          <SelectField className="min-w-0 flex-1" label={t("signup.professional.country")} options={countries} {...register("country")} />
          <Field className="min-w-0 flex-1" label={t("signup.professional.city")} placeholder={t("signup.professional.cityPh")} error={errors.city?.message} {...register("city")} />
        </div>
        <Alert title={t("signup.professional.alertTitle")}>{t("signup.professional.alertBody")}</Alert>
        <div className="flex items-start justify-between">
          <Button href="/signup/account">{t("common.back")}</Button>
          <Button variant="primary" type="submit">{t("common.next")}</Button>
        </div>
      </form>
      <AlreadyHaveAccount />
    </Card>
  );
}
