"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecorderFlow } from "@/components/recorder/recorder-flow";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, SelectField } from "@/components/ui/field";
import { eligibility, puma, pumaScore, type PumaAnswers } from "@/config/triage";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

type Step = "consent" | "person" | "questions" | "voice";
const order: Step[] = ["consent", "person", "questions", "voice"];
type YesNo = "dyspnea" | "phlegm" | "cough" | "priorSpirometry";

/** Consent, the person, the seven PUMA items, then about 10 seconds of voice. Every step is done with the person present. */
export function TriageFlow({ centres, voiceEnabled }: { centres: string[]; voiceEnabled: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>("consent");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [person, setPerson] = useState({ name: "", phone: "", centre: centres[0], sex: "f" as "f" | "m", age: "", smoking: "current" as "current" | "former" | "never", packYears: "", diagnosed: false });
  const [yes, setYes] = useState<Record<YesNo, boolean | undefined>>({ dyspnea: undefined, phlegm: undefined, cough: undefined, priorSpirometry: undefined });
  const [created, setCreated] = useState<{ id: string; patientId: string; code: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const age = Number(person.age);
  const packYears = Number(person.packYears);
  const answers: PumaAnswers = { sex: person.sex, age, packYears, dyspnea: !!yes.dyspnea, phlegm: !!yes.phlegm, cough: !!yes.cough, priorSpirometry: !!yes.priorSpirometry };
  const answeredAll = (Object.keys(yes) as YesNo[]).every((k) => yes[k] !== undefined);

  function personGate(): string | null {
    if (person.name.trim().length < 2 || !person.age) return t("signup.errors.required");
    if (age < eligibility.minAge) return t("triage.notEligible.young");
    if (person.smoking === "never") return t("triage.notEligible.never");
    if (!(packYears >= eligibility.minPackYears)) return t("triage.notEligible.packYears");
    if (person.diagnosed) return t("triage.notEligible.diagnosed");
    return null;
  }

  async function finishQuestions() {
    if (!answeredAll) return setError(t("signup.errors.required"));
    if (!yes.dyspnea && !yes.phlegm && !yes.cough) return setError(t("triage.notEligible.noSymptoms"));
    setSaving(true);
    const res = await fetch("/api/triage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: person.name, phone: person.phone || undefined, centre: person.centre, consent: true, answers }) });
    setSaving(false);
    if (!res.ok) return setError(t("settings.save.error"));
    const c = (await res.json()) as { id: string; patientId: string; code: string };
    setCreated(c);
    if (!voiceEnabled) return router.push(`/triage/${c.id}`);
    setStep("voice");
  }

  const yesNo = (k: YesNo) => (
    <fieldset key={k} className="flex flex-col gap-2 rounded-[16px] bg-surface-soft p-4">
      <legend className="sr-only">{t(`triage.q.${k}`)}</legend>
      <p className="text-[14px] leading-[1.45]">{t(`triage.q.${k}`)}</p>
      <div className="flex gap-2">
        {([true, false] as const).map((v) => (
          <button key={String(v)} type="button" aria-pressed={yes[k] === v} onClick={() => { setYes({ ...yes, [k]: v }); setError(null); }}
            className={cn("h-11 min-w-[88px] rounded-input px-4 text-[14px] font-medium", yes[k] === v ? "bg-ink text-on-accent" : "border border-line bg-surface hover:bg-surface-soft")}>
            {v ? t("triage.yes") : t("triage.no")}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <ol className="flex flex-wrap gap-2" aria-label={t("triage.new")}>
        {[...order, "result" as const].map((s, i) => (
          <li key={s} aria-current={s === step ? "step" : undefined} className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium", s === step ? "bg-ink text-on-accent" : i < order.indexOf(step) ? "bg-cobalt-tint text-cobalt" : "bg-surface text-ink-muted")}>
            {i + 1} · {t(`triage.steps.${s}`)}
          </li>
        ))}
      </ol>

      {step === "consent" && (
        <Card className="gap-4 p-6">
          <h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("triage.consentTitle")}</h2>
          <blockquote className="rounded-[16px] bg-cobalt-tint p-4 text-[15px] leading-[1.6]">{t("triage.consentScript")}</blockquote>
          <Checkbox label={t("triage.consentCheck")} checked={consent} onCheckedChange={(v) => { setConsent(v); setError(null); }} error={error ?? undefined} />
          <div><Button variant="primary" onClick={() => (consent ? (setError(null), setStep("person")) : setError(t("triage.consentRequired")))}>{t("triage.continue")}</Button></div>
        </Card>
      )}

      {step === "person" && (
        <Card className="gap-4 p-6">
          <h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("triage.personTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <Field label={t("triage.name")} value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} autoComplete="off" />
            <Field label={t("triage.phone")} type="tel" value={person.phone} onChange={(e) => setPerson({ ...person, phone: e.target.value })} hint={t("triage.phoneHint")} autoComplete="off" />
            <SelectField label={t("triage.centre")} value={person.centre} onChange={(e) => setPerson({ ...person, centre: e.target.value })} options={centres} />
            <SelectField label={t("triage.sex")} value={person.sex} onChange={(e) => setPerson({ ...person, sex: e.target.value as "f" | "m" })} options={[{ value: "f", label: t("triage.female") }, { value: "m", label: t("triage.male") }]} />
            <Field label={t("triage.age")} type="number" inputMode="numeric" min={18} max={110} value={person.age} onChange={(e) => setPerson({ ...person, age: e.target.value })} />
            <SelectField label={t("triage.smoking")} value={person.smoking} onChange={(e) => setPerson({ ...person, smoking: e.target.value as typeof person.smoking })} options={(["current", "former", "never"] as const).map((v) => ({ value: v, label: t(`triage.${v}`) }))} />
            {person.smoking !== "never" && <Field label={t("triage.packYears")} type="number" inputMode="decimal" min={0} value={person.packYears} onChange={(e) => setPerson({ ...person, packYears: e.target.value })} hint={t("triage.packYearsHint")} />}
          </div>
          <Checkbox label={t("triage.diagnosed")} checked={person.diagnosed} onCheckedChange={(v) => setPerson({ ...person, diagnosed: v })} />
          {error && <Alert state="warning" title={error} />}
          <div className="flex gap-[10px]">
            <Button onClick={() => { setError(null); setStep("consent"); }}>{t("triage.back")}</Button>
            <Button variant="primary" onClick={() => { const g = personGate(); setError(g); if (!g) setStep("questions"); }}>{t("triage.continue")}</Button>
          </div>
        </Card>
      )}

      {step === "questions" && (
        <Card className="gap-4 p-6">
          <div className="leading-[1.45]"><h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("triage.questionsTitle")}</h2><p className="text-[12px] text-ink-muted">{t("triage.questionsSub")}</p></div>
          {(["dyspnea", "phlegm", "cough", "priorSpirometry"] as const).map(yesNo)}
          {answeredAll && <p className="text-[13px] text-ink-muted" aria-live="polite">{t("triage.pumaScore", { n: pumaScore(answers), max: puma.max })} · {t("triage.pumaCut", { cut: puma.cutoff })}</p>}
          {error && <Alert state="warning" title={error} />}
          <div className="flex gap-[10px]">
            <Button onClick={() => { setError(null); setStep("person"); }}>{t("triage.back")}</Button>
            <Button variant="primary" onClick={finishQuestions} disabled={saving}>{t("triage.continue")}</Button>
          </div>
        </Card>
      )}

      {step === "voice" && created && (
        <div className="flex flex-col gap-4">
          <div className="leading-[1.45]"><h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("triage.voiceTitle")}</h2><p className="text-[12px] text-ink-muted">{t("triage.voiceSub")}</p></div>
          <RecorderFlow mode="assisted" protocol="triage" patientId={created.patientId} patientName={person.name} patientCode={created.code} consent="active"
            onUploaded={async (recordingId) => {
              await fetch(`/api/triage/${created.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "voice", recordingId }) });
              router.push(`/triage/${created.id}`);
            }} />
          <div><Button onClick={() => router.push(`/triage/${created.id}`)}>{t("triage.skipVoice")}</Button></div>
        </div>
      )}
    </div>
  );
}
