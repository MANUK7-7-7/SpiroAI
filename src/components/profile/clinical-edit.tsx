"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import type { ClinicalData } from "@/data/schemas";
import { useT } from "@/lib/i18n/client";

/** Fields are read-only until "Edit clinical data" is pressed. Every save is audited with author, time and previous value. */
export function ClinicalRecord({ patientId, data, meta }: { patientId: string; data: ClinicalData; meta: string }) {
  const { t } = useT();
  const router = useRouter();
  const initial = { diagnosis: data.diagnosis, gold: data.goldStage ? `GOLD ${data.goldStage}` : "—", ratio: data.fev1Fvc, fev1: `${data.fev1Pct}%` };
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function save() {
    const res = await fetch(`/api/patients/${patientId}/clinical`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ diagnosis: v.diagnosis, goldStage: Number(v.gold.replace(/\D/g, "")) || undefined, fev1Fvc: v.ratio, fev1Pct: Number(v.fev1.replace(/\D/g, "")) || 0 }),
    });
    if (res.ok) { setSaved(true); setEdit(false); router.refresh(); }
  }

  return (
    <div className="flex items-start gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Card>
          <CardHeading title={t("clinical.diagTitle")} description={meta} />
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1" label={t("clinical.diagnosis")} value={v.diagnosis} onChange={set("diagnosis")} readOnly={!edit} />
            <Field className="min-w-0 flex-1" label={t("clinical.gold")} value={v.gold} onChange={set("gold")} readOnly={!edit} />
          </div>
          <div className="flex gap-4">
            <Field className="min-w-0 flex-1" label={t("clinical.ratio")} value={v.ratio} onChange={set("ratio")} readOnly={!edit} />
            <Field className="min-w-0 flex-1" label={t("clinical.fev1")} value={v.fev1} onChange={set("fev1")} readOnly={!edit} />
          </div>
          <p className="text-[12px] leading-[1.45] text-ink-muted">{t("clinical.previous", { x: data.previousSpirometry })}</p>
          {saved && <Alert state="success" title={t("clinical.saved")} />}
        </Card>
        <Card>
          <CardHeading title={t("clinical.medsTitle")} />
          {data.medications.length === 0 && <p className="text-[12px] text-ink-muted">{t("clinical.noMeds")}</p>}
          {data.medications.map((m) => (
            <div key={m.name} className="flex flex-col gap-[6px] leading-[1.45]">
              <p className="text-[14px] font-medium tracking-[-0.01em]">{m.name} · {m.detail}</p>
              <p className="text-[12px] text-ink-muted">{m.role}</p>
            </div>
          ))}
          <div><Button size="sm">{t("clinical.editMeds")}</Button></div>
        </Card>
      </div>
      <Card className="w-[350px] shrink-0">
        <CardHeading title={t("clinical.contextTitle")} />
        <div className="text-[13px] leading-[1.45] tracking-[-0.005em]">
          <p>{t("clinical.smoking", { x: data.smoking })}</p>
          {data.stopped && <p>{t("clinical.stopped", { x: data.stopped })}</p>}
          <p>{t("clinical.comorbidities", { x: data.comorbidities })}</p>
          <p>{t("clinical.allergies", { x: data.allergies })}</p>
        </div>
        <Alert title={t("clinical.auditTitle")}>{t("clinical.auditBody")}</Alert>
        <div className="flex gap-3">
          {edit ? (
            <>
              <Button variant="primary" onClick={save}>{t("clinical.save")}</Button>
              <Button onClick={() => { setEdit(false); setV(initial); }}>{t("clinical.cancel")}</Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setEdit(true)}>{t("clinical.edit")}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
