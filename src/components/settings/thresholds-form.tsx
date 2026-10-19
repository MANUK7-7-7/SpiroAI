"use client";

import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

type D = SettingsData["thresholds"];
const num = (v: string) => (v === "" ? 0 : Number(v));

/** Institution risk bands and default alert rules. Changes are audited and re-band existing results on read. */
export function ThresholdsForm({ initial }: { initial: D }) {
  const { t } = useT();
  const { draft, update, save, state, errors } = useSection("thresholds", initial);
  const n = (k: keyof D, label: string, error?: string) => (
    <Field label={label} type="number" inputMode="numeric" min={1} value={draft[k] || ""} onChange={(e) => update({ [k]: num(e.target.value) } as Partial<D>)} error={error} className="w-[110px]" />
  );
  const order = errors.moderateFrom ? t("settings.thresholds.orderError") : undefined;
  const bands = [
    { band: "low" as const, range: `0–${draft.moderateFrom - 1}` },
    { band: "moderate" as const, range: `${draft.moderateFrom}–${draft.highFrom - 1}` },
    { band: "high" as const, range: `${draft.highFrom}–100` },
  ];
  const rule = (title: string, value: string, fields: React.ReactNode) => (
    <div className="flex flex-col gap-3 rounded-[16px] bg-surface-soft p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-[14px] font-medium tracking-[-0.01em]">{title}</p><p className="text-[12px] text-ink-muted">{value}</p></div>
      <div className="flex flex-wrap gap-4">{fields}</div>
    </div>
  );
  return (
    <Panel title={t("settings.thresholds.title")} sub={t("settings.thresholds.sub")}>
      <Alert state="warning" title={t("settings.thresholds.alertTitle")}>{t("settings.thresholds.alertBody")}</Alert>
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        {bands.map((b) => (
          <div key={b.band} className="flex flex-col gap-3 rounded-card p-5 shadow-[inset_0_0_0_1px_var(--line)]">
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">{t(`settings.thresholds.${b.band}`)}</h3>
            <div><RiskBadge band={b.band} label={t(`settings.thresholds.${b.band}`)} /></div>
            {b.band === "low"
              ? <Field label={t("settings.thresholds.riskIndex")} readOnly value={b.range} />
              : <Field label={`${t("settings.thresholds.riskIndex")} · ${t("settings.thresholds.from")}`} type="number" inputMode="numeric" value={draft[b.band === "moderate" ? "moderateFrom" : "highFrom"] || ""} onChange={(e) => update({ [b.band === "moderate" ? "moderateFrom" : "highFrom"]: num(e.target.value) } as Partial<D>)} error={b.band === "moderate" ? order : undefined} hint={b.range} />}
          </div>
        ))}
      </div>
      {rule(t("settings.thresholds.sustained"), t("settings.thresholds.sustainedVal", { pts: draft.sustainedPts, n: draft.sustainedTests }), <>{n("sustainedPts", t("settings.thresholds.points"))}{n("sustainedTests", t("settings.thresholds.tests"))}</>)}
      {rule(t("settings.thresholds.rapid"), t("settings.thresholds.rapidVal", { pts: draft.rapidPts, days: draft.rapidDays }), <>{n("rapidPts", t("settings.thresholds.points"))}{n("rapidDays", t("settings.thresholds.days"))}</>)}
      {rule(t("settings.thresholds.missed"), t("settings.thresholds.missedVal", { n: draft.missedTests }), n("missedTests", t("settings.thresholds.tests")))}
      {rule(t("settings.thresholds.poorQuality"), t("settings.thresholds.poorVal", { n: draft.poorCount, days: draft.poorDays }), <>{n("poorCount", t("settings.thresholds.recordings"))}{n("poorDays", t("settings.thresholds.days"))}</>)}
      <p className="text-[12px] text-ink-muted">{t("settings.thresholds.note")}</p>
      <SaveBar label={t("settings.thresholds.save")} state={state} onSave={save} onRetry={save} savedLabel={t("settings.thresholds.saved")} />
    </Panel>
  );
}
