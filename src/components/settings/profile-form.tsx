"use client";

import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

export function ProfileForm({ initial, initials }: { initial: SettingsData["profile"]; initials: string }) {
  const { t } = useT();
  const { draft, update, save, state, errors } = useSection("profile", initial);
  const file = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ name: string } | { error: true } | null>(null);
  const err = (k: string) => (errors[k] ? t("signup.errors.required") : undefined);
  return (
    <Panel title={t("settings.profile.title")} sub={t("settings.profile.sub")}>
      <div className="flex items-center gap-4">
        <Avatar initials={initials} className="size-16 text-[16px]" />
        <div className="flex flex-col items-start gap-1">
          <input ref={file} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label={t("settings.profile.upload")} tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(["image/jpeg", "image/png"].includes(f.type) && f.size <= 5_000_000 ? { name: f.name } : { error: true }); }} />
          <Button size="sm" radius="lg" onClick={() => file.current?.click()}>{t("settings.profile.upload")}</Button>
          <p className="text-[11px] text-ink-muted">{photo && "name" in photo ? t("settings.profile.photoChosen", { name: photo.name }) : t("settings.profile.photo")}</p>
          {photo && "error" in photo && <p role="alert" className="text-[11px] text-risk-high">{t("settings.profile.photoError")}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Field label={t("settings.profile.name")} value={draft.fullName} onChange={(e) => update({ fullName: e.target.value })} error={err("fullName")} />
        <Field label={t("settings.profile.specialty")} value={draft.specialty} onChange={(e) => update({ specialty: e.target.value })} error={err("specialty")} />
        <Field label={t("settings.profile.email")} type="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} error={errors.email ? t("signup.errors.email") : undefined} />
        <Field label={t("settings.profile.institution")} value={draft.institution} onChange={(e) => update({ institution: e.target.value })} error={err("institution")} />
        <Field label={t("settings.profile.country")} value={draft.country} onChange={(e) => update({ country: e.target.value })} error={err("country")} />
        <Field label={t("settings.profile.city")} value={draft.city} onChange={(e) => update({ city: e.target.value })} error={err("city")} />
      </div>
      <Alert state="info" title={t("settings.profile.licenseTitle", { n: draft.license })}>{t("settings.profile.licenseBody")}</Alert>
      <SaveBar label={t("settings.profile.save")} state={state} onSave={save} onRetry={save} />
    </Panel>
  );
}
