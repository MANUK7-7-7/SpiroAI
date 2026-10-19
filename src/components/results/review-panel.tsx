"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/client";

type Props = { resultId: string; patientId: string; reviewed?: { who: string; when: string; judgment: "agree" | "disagree"; note: string }; disabled?: boolean };

/** The doctor's judgment. Stored as labelled feedback; shared with the AI team only if the box is ticked, and only de-identified. */
export function ReviewPanel({ resultId, patientId, reviewed, disabled }: Props) {
  const { t } = useT();
  const router = useRouter();
  const [judgment, setJudgment] = useState<"agree" | "disagree">(reviewed?.judgment ?? "agree");
  const [note, setNote] = useState(reviewed?.note ?? "");
  const [share, setShare] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(reviewed ? "saved" : "idle");

  async function save() {
    setState("saving");
    const res = await fetch(`/api/results/${resultId}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ judgment, note, shareDeidentifiedFeedback: share }) });
    if (!res.ok) return setState("error");
    setState("saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHeading title={t("result.judgeTitle")} description={t("result.judgeSub")} />
      <Alert title={t("result.alertTitle")}>{t("result.alertBody")}</Alert>
      <Tabs label={t("result.judgeTitle")} value={judgment} onChange={setJudgment} tabs={[{ id: "agree", label: t("result.agree") }, { id: "disagree", label: t("result.disagree") }]} />
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="clinical-note" className="text-[12px] font-medium leading-[1.45] tracking-[-0.01em]">{t("result.note")}</label>
        <textarea id="clinical-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("result.notePh")} rows={3} maxLength={2000} className="min-h-[76px] w-full resize-y rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-ink-muted focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" />
      </div>
      <Checkbox label={t("result.share")} checked={share} onCheckedChange={setShare} />
      {state === "saved" && <Alert state="success" title={t("result.saved")}>{reviewed ? t("result.reviewedBy", { who: reviewed.who, when: reviewed.when }) : t("result.savedBody")}</Alert>}
      {state === "error" && <Alert state="error" title={t("result.saveError")} />}
      <div className="flex flex-col items-start gap-[18px]">
        <Button variant="primary" onClick={save} disabled={disabled || state === "saving"}>{t("result.markReviewed")}</Button>
        <Button href={`?panel=action`} >{t("result.action")}</Button>
        <Button href={`?panel=action&type=repeat`}>{t("result.repeat")}</Button>
        <Button href={`/patients/${patientId}/trends`}>{t("result.seeTrend")}</Button>
      </div>
    </Card>
  );
}
