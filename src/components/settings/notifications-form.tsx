"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

export function NotificationsForm({ initial }: { initial: SettingsData["notifications"] }) {
  const { t } = useT();
  const { draft, update, save, state } = useSection("notifications", initial);
  return (
    <Panel title={t("settings.notifications.title")} sub={t("settings.notifications.sub")}>
      <Switch checked={draft.push} onCheckedChange={(v) => update({ push: v })} label={t("settings.notifications.push")} description={t("settings.notifications.pushDesc")} />
      <Switch checked={draft.email} onCheckedChange={(v) => update({ email: v })} label={t("settings.notifications.email")} description={t("settings.notifications.emailDesc")} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[11px] font-medium tracking-[0.06em] text-ink-muted">{t("settings.notifications.severities")}</legend>
        <div className="flex flex-wrap gap-6">
          {(["high", "moderate", "low"] as const).map((k) => (
            <Checkbox key={k} label={t(`settings.notifications.${k}`)} checked={draft.severities[k]} onCheckedChange={(v) => update({ severities: { ...draft.severities, [k]: v } })} />
          ))}
        </div>
      </fieldset>
      <Switch checked={draft.quiet} onCheckedChange={(v) => update({ quiet: v })} label={t("settings.notifications.quiet")} description={t("settings.notifications.quietDesc")} />
      {draft.quiet && (
        <div className="grid max-w-[420px] grid-cols-2 gap-4">
          <Field label={t("settings.notifications.from")} type="time" value={draft.quietFrom} onChange={(e) => update({ quietFrom: e.target.value })} />
          <Field label={t("settings.notifications.to")} type="time" value={draft.quietTo} onChange={(e) => update({ quietTo: e.target.value })} />
        </div>
      )}
      <Switch checked={draft.daily} onCheckedChange={(v) => update({ daily: v })} label={t("settings.notifications.daily")} description={t("settings.notifications.dailyDesc")} />
      {draft.daily && <Field className="max-w-[200px]" label={t("settings.notifications.deliveryTime")} type="time" value={draft.dailyAt} onChange={(e) => update({ dailyAt: e.target.value })} />}
      <SaveBar label={t("settings.notifications.save")} state={state} onSave={save} onRetry={save} />
    </Panel>
  );
}
