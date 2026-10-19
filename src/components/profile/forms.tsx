"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useT } from "@/lib/i18n/client";

const area = "min-h-[76px] w-full resize-y rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-ink-muted focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--cobalt)]";

export function NoteForm({ patientId }: { patientId: string }) {
  const { t } = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() {
    if (!text.trim()) return;
    setState("saving");
    const res = await fetch(`/api/patients/${patientId}/notes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    if (!res.ok) return setState("error");
    setText(""); setState("saved"); router.refresh();
  }
  return (
    <Card className="w-[350px] shrink-0">
      <CardHeading title={t("notes.addTitle")} />
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="note" className="text-[12px] font-medium leading-[1.45] tracking-[-0.01em]">{t("notes.label")}</label>
        <textarea id="note" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("notes.placeholder")} rows={3} maxLength={4000} className={area} />
      </div>
      <p className="text-[12px] leading-[1.45] text-ink-muted">{t("notes.hint")}</p>
      {state === "saved" && <Alert state="success" title={t("notes.saved")} />}
      {state === "error" && <Alert state="error" title={t("result.saveError")} />}
      <div><Button variant="primary" onClick={save} disabled={!text.trim() || state === "saving"}>{t("notes.save")}</Button></div>
    </Card>
  );
}

const TYPES = ["medication", "spirometry", "doctor_note", "exacerbation", "other"] as const;

export function EventForm({ patientId, defaultDate }: { patientId: string; defaultDate: string }) {
  const { t } = useT();
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>("medication");
  const [date, setDate] = useState(defaultDate);
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() {
    setState("saving");
    const res = await fetch(`/api/patients/${patientId}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, date, detail }) });
    if (!res.ok) return setState("error");
    setDetail(""); setState("saved"); router.refresh();
  }
  return (
    <Card>
      <CardHeading title={t("trends.eventTitle")} />
      <SelectField label={t("trends.eventType")} value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])} options={TYPES.map((k) => ({ value: k, label: t(`trends.eventTypes.${k}`) }))} />
      <Field label={t("trends.eventDate")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Field label={t("trends.eventDetails")} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="" maxLength={200} />
      {state === "saved" && <Alert state="success" title={t("trends.eventSaved")} />}
      {state === "error" && <Alert state="error" title={t("result.saveError")} />}
      <div><Button variant="primary" onClick={save} disabled={state === "saving"}>{t("trends.eventSave")}</Button></div>
    </Card>
  );
}
