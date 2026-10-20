"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, SelectField } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { FilterChip } from "@/components/ui/filter-chip";
import { monitoringProfiles, profileIds, type MonitoringProfile } from "@/config/monitoring-profiles";
import type { MonitoringPlan } from "@/data/schemas";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

const FREQ = ["daily", "weekly", "biweekly", "monthly", "quarterly", "semiannual", "custom"] as const;
const STEP_DAYS = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 91, semiannual: 182 } as const;
const addWeeks = (iso: string, w: number) => new Date(Date.parse(iso) + w * 7 * 86_400_000).toISOString().slice(0, 10);

/** Monitoring plan. Saving updates the patient app and is audit logged. Only a clinician can change a plan. */
export function PlanForm({ patientId, plan, suggested }: { patientId: string; plan: MonitoringPlan; suggested: MonitoringProfile }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [profile, setProfile] = useState<MonitoringProfile>(plan.profile ?? suggested);
  const [freq, setFreq] = useState<(typeof FREQ)[number]>(plan.frequency);
  const [customDays, setCustomDays] = useState(3);
  const [time, setTime] = useState(plan.time);
  const [sens, setSens] = useState<"standard" | "high">(plan.sensitivity === "high" ? "high" : "standard");
  const [thenFreq, setThenFreq] = useState<MonitoringPlan["frequency"] | undefined>(plan.profile === "post_exacerbation" ? monitoringProfiles.post_exacerbation.thenFrequency : undefined);
  const [weeks, setWeeks] = useState(plan.durationWeeks);
  const [review, setReview] = useState(plan.reviewOn);
  const [notify, setNotify] = useState(true);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const stepDays = freq === "custom" ? customDays : STEP_DAYS[freq];
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }), [locale]);
  const dates = [0, 1, 2].map((i) => fmt.format(new Date(Date.parse(plan.nextTestAt) + i * stepDays * 86_400_000)).replace(/\./g, "").replace("Sept", "Sep"));
  const freqLabel = t(`plan.freqLower.${freq}`);

  async function save() {
    setState("saving");
    const res = await fetch(`/api/patients/${patientId}/plan`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile, frequency: freq === "custom" ? "daily" : freq, customDays: freq === "custom" ? customDays : undefined, time, sensitivity: sens, durationWeeks: weeks, reviewOn: review, notifyPatient: notify }),
    });
    if (!res.ok) return setState("error");
    setState("saved");
    router.refresh();
  }
  function applyProfile(id: MonitoringProfile) {
    const d = monitoringProfiles[id];
    setProfile(id); setFreq(d.frequency); setSens(d.sensitivity === "high" ? "high" : "standard"); setWeeks(d.durationWeeks);
    setReview(addWeeks(plan.nextTestAt, d.durationWeeks)); setThenFreq("thenFrequency" in d ? d.thenFrequency : undefined); setState("idle");
  }
  function reset() { applyProfile(suggested); setTime("09:00"); }

  return (
    <div className="flex items-start gap-6">
      <Card className="min-w-0 flex-1 rounded-panel">
        <CardHeading title={t("plan.profileTitle")} description={t("plan.profileSub")} />
        <div role="radiogroup" aria-label={t("plan.profileTitle")} className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          {profileIds.map((id) => {
            const on = id === profile;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} onClick={() => applyProfile(id)}
                className={cn("flex flex-col items-start gap-2 rounded-[20px] p-4 text-left shadow-[inset_0_0_0_1px_var(--line)]", on ? "bg-cobalt-tint shadow-[inset_0_0_0_2px_var(--cobalt)]" : "bg-surface hover:bg-surface-soft")}>
                <span className="text-[14px] font-medium tracking-[-0.01em]">{t(`plan.profiles.${id}.name`)}</span>
                <span className="text-[12px] leading-[1.45] text-ink-muted">{t(`plan.profiles.${id}.goal`)}</span>
                <span className="text-[12px] font-medium text-cobalt">{t(`plan.profiles.${id}.cadence`)}</span>
                {id === suggested && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-on-accent">{t("plan.suggestedBadge")}</span>}
              </button>
            );
          })}
        </div>
        <Alert state="warning" title={t("plan.sampleTitle")}>{t("plan.sampleBody")}</Alert>
        {thenFreq && freq === "weekly" && <p className="text-[12px] leading-[1.45] text-ink-muted">{t("plan.stepDown", { weeks, freq: t(`plan.freqLower.${thenFreq}`) })}</p>}
        <CardHeading title={t("plan.schedule")} />
        <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("plan.frequency")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("plan.frequency")}>
          {FREQ.map((f) => <FilterChip key={f} label={t(`plan.freqs.${f}`)} selected={freq === f} onClick={() => { setFreq(f); setThenFreq(undefined); }} className="px-4 py-[10px] text-[13px] font-medium tracking-normal" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("plan.reminder")} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <SelectField label={t("plan.tz")} options={["Buenos Aires · UTC-3", "Santiago · UTC-3", "Montevideo · UTC-3", "Madrid · UTC+1"]} defaultValue="Buenos Aires · UTC-3" />
        </div>
        <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("plan.sensitivity")}</p>
        <Tabs label={t("plan.sensitivity")} value={sens} onChange={setSens} tabs={[{ id: "standard", label: t("plan.sens.standard") }, { id: "high", label: t("plan.sens.high") }]} />
        <p className="text-[12px] leading-[1.45] text-ink-muted">{t("plan.sensNote")}</p>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label={t("plan.duration")} value={String(weeks)} onChange={(e) => setWeeks(Number(e.target.value))} options={[4, 6, 8, 12, 24, 52].map((n) => ({ value: String(n), label: t("plan.weeks", { n }) }))} />
          <Field label={t("plan.reviewDate")} type="date" value={review} onChange={(e) => setReview(e.target.value)} />
        </div>
        <Checkbox label={t("plan.notify")} checked={notify} onCheckedChange={setNotify} />
        {state === "saved" && <Alert state="success" title={t("plan.saved")} />}
        {state === "error" && <Alert state="error" title={t("plan.error")} />}
        <div className="flex gap-3"><Button variant="primary" onClick={save} disabled={state === "saving"}>{t("plan.save")}</Button><Button onClick={reset}>{t("plan.reset")}</Button></div>
        <p className="text-[11px] leading-[1.45] text-ink-muted">{t("plan.auditNote")}</p>
      </Card>
      <div className="flex w-[350px] shrink-0 flex-col gap-6">
        <Card className="rounded-panel">
          <CardHeading title={t("plan.nextTitle")} description={t("plan.preview", { freq: freqLabel, time })} />
          {dates.map((d) => (
            <div key={d} className="flex items-center justify-between rounded-[16px] bg-surface-soft px-4 py-[18px] text-[15px] tracking-[-0.01em]"><span>{d}</span><span className="text-[13px] text-cobalt">{time}</span></div>
          ))}
          <p className="text-[12px] text-ink-muted">{t("plan.nextReview", { date: fmt.format(new Date(`${review}T12:00:00-03:00`)).replace(/\./g, "").replace("Sept", "Sep") })}</p>
        </Card>
        {(freq === "daily" || freq === "custom") && (
          <Card className="rounded-panel">
            <CardHeading title={t("plan.dailyTitle")} />
            <Alert state="warning" title={t("plan.burden")}>{t("plan.burdenBody")}</Alert>
            {freq === "custom" && (
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="custom-days" className="text-[12px] font-medium">{t("plan.custom")}</label>
                <input id="custom-days" type="number" min={1} max={60} value={customDays} onChange={(e) => setCustomDays(Math.min(60, Math.max(1, Number(e.target.value) || 1)))} aria-label={t("plan.everyDays", { n: customDays })} className="min-h-[46px] w-full rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" />
                <p className="text-[11px] text-ink-muted">{t("plan.everyDays", { n: customDays })}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
