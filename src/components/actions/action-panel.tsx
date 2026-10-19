"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/lib/i18n/client";

type Summary = { patient: { id: string; name: string; code: string; consent: string }; alert?: { id: string; code: string } };
type Kind = "spirometry" | "follow_up_visit" | "referral" | "adjust_frequency" | "repeat_test";

const box = "w-full resize-y rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--cobalt)]";

/** Which patient does the current page belong to? Explicit ?patient=, else /patients/[id] or /results/r-[patient]-n. */
function patientFromPath(pathname: string) {
  return pathname.match(/^\/patients\/(p-\d+)/)?.[1] ?? pathname.match(/^\/results\/r-(p-\d+)-/)?.[1];
}

/** S12: clinical action side panel. Opens with ?panel=action. Nothing happens until a clinician confirms. */
export function ActionPanelHost() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const open = params.get("panel") === "action";
  const patientId = params.get("patient") ?? patientFromPath(pathname);
  const alertId = params.get("alert") ?? undefined;
  const close = () => { const next = new URLSearchParams(params.toString()); ["panel", "patient", "alert", "type"].forEach((k) => next.delete(k)); router.replace(next.size ? `${pathname}?${next}` : pathname); };
  if (!open || !patientId) return null;
  return <Panel patientId={patientId} alertId={alertId} repeat={params.get("type") === "repeat"} close={close} />;
}

function Panel({ patientId, alertId, repeat, close }: { patientId: string; alertId?: string; repeat: boolean; close: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary>();
  const [kinds, setKinds] = useState<Record<Kind, boolean>>({ spirometry: !repeat, follow_up_visit: !repeat, referral: false, adjust_frequency: false, repeat_test: repeat });
  const [date, setDate] = useState("2026-10-20");
  const [time, setTime] = useState("10:30");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState(repeat ? "" : t("action.defaultNote"));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "none">("idle");
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    fetch(`/api/patients/${patientId}/summary${alertId ? `?alert=${alertId}` : ""}`).then((r) => r.json()).then((s: Summary) => {
      setSummary(s);
      const first = s.patient.name.split(" ")[0];
      setMessage(t(repeat ? "action.repeatMessage" : "action.defaultMessage", { first }));
    });
  }, [patientId, alertId, repeat, t]);

  const first = summary?.patient.name.split(" ")[0] ?? "";
  const locked = summary?.patient.consent === "revoked";
  const fullMessage = useMemo(() => `${message}\n\n${t("action.emergency")}`, [message, t]);

  async function submit(notify: boolean) {
    const chosen = (Object.keys(kinds) as Kind[]).filter((k) => kinds[k]);
    if (!chosen.length) return setState("none");
    setState("saving");
    const res = await fetch("/api/actions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId, alertId, kinds: chosen, followUp: kinds.follow_up_visit ? { date, time } : undefined, messageToPatient: notify ? fullMessage : undefined, internalNote: note || undefined, notify }),
    });
    if (!res.ok) return setState("error");
    setNotified(notify);
    setState("saved");
    router.refresh();
  }

  const toggle = (k: Kind) => (v: boolean) => setKinds({ ...kinds, [k]: v });

  return (
    <Dialog.Root open onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-[590px] max-w-full flex-col gap-5 overflow-y-auto rounded-l-shell bg-surface p-8 outline-none">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="font-display text-[26px] font-medium leading-[1.2] tracking-[-0.03em]">{t("action.title")}</Dialog.Title>
              <Dialog.Description className="text-[12px] text-ink-muted">{summary ? (summary.alert ? t("action.sub", { name: summary.patient.name, code: summary.patient.code, alert: summary.alert.code }) : t("action.subNoAlert", { name: summary.patient.name, code: summary.patient.code })) : "…"}</Dialog.Description>
            </div>
            <Dialog.Close aria-label={t("action.close")} className="rounded-full p-2 text-cobalt hover:bg-surface-soft"><X size={18} /></Dialog.Close>
          </div>
          <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("action.section")}</p>
          {locked && <Alert state="error" title={t("states.flowB.revokedAlert")}>{t("states.flowB.revokedBody")}</Alert>}
          <Checkbox label={t("action.spirometry")} checked={kinds.spirometry} onCheckedChange={toggle("spirometry")} />
          <Checkbox label={t("action.visit")} checked={kinds.follow_up_visit} onCheckedChange={toggle("follow_up_visit")} />
          {kinds.follow_up_visit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[7px]"><label htmlFor="fu-date" className="text-[12px] font-medium">{t("action.date")}</label><input id="fu-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[46px] rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" /></div>
              <div className="flex flex-col gap-[7px]"><label htmlFor="fu-time" className="text-[12px] font-medium">{t("action.time")}</label><input id="fu-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-[46px] rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" /></div>
            </div>
          )}
          <Checkbox label={t("action.refer")} checked={kinds.referral} onCheckedChange={toggle("referral")} />
          <Checkbox label={t("action.freq")} checked={kinds.adjust_frequency} onCheckedChange={toggle("adjust_frequency")} />
          <Checkbox label={t("action.repeat")} checked={kinds.repeat_test} onCheckedChange={toggle("repeat_test")} />
          <div className="flex flex-col gap-[7px]"><label htmlFor="msg" className="text-[12px] font-medium">{t("action.msgLabel")}</label><textarea id="msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1500} className={box} /></div>
          <div className="flex flex-col gap-[7px]"><label htmlFor="note" className="text-[12px] font-medium">{t("action.noteLabel")}</label><textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} className={box} /></div>
          <div className="rounded-panel bg-cobalt-tint p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-cobalt">{t("action.previewLabel")}</p>
            <p className="mt-3 text-[13px] leading-[1.45]">{message}</p>
            <p className="mt-2 text-[11px] leading-[1.45] text-ink-muted">{t("action.emergency")}</p>
            <p className="mt-2 text-[11px] text-ink-muted">{t("action.from", { who: "Dr. Elena Morales", clinic: "Riverside Clinic" })}</p>
          </div>
          {state === "saved" && <Alert state="success" title={t(notified ? "action.savedNotified" : "action.saved")} />}
          {state === "none" && <Alert state="warning" title={t("action.pickOne")} />}
          {state === "error" && <Alert state="error" title={t("action.error")} />}
          <div className="flex flex-col items-start gap-5">
            <Button variant="primary" onClick={() => submit(true)} disabled={state === "saving" || state === "saved" || locked || !first}>{t("action.confirm")}</Button>
            <Button onClick={() => submit(false)} disabled={state === "saving" || state === "saved"}>{t("action.saveOnly")}</Button>
          </div>
          <p className="text-[11px] leading-[1.45] text-ink-muted">{t("action.footnote")}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
