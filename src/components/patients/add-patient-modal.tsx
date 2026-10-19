"use client";

import * as Dialog from "@radix-ui/react-dialog";
import QRCode from "qrcode";
import { Check, CircleCheck, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/client";

const DRAFT_KEY = "spiro.addPatient.draft";

type Saved = { patient: { id: string; code: string; name: string }; token: string };

/** S07: Add a patient (clinical data) then Invite. Draft lives in sessionStorage only: patient data must not outlive a shared clinic session. */
export function AddPatientModal() {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"diagnosed" | "at_risk">("diagnosed");
  const [saved, setSaved] = useState<Saved>();
  const [error, setError] = useState(false);
  const [draftNote, setDraftNote] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(3, t("addPatient.errName")),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("addPatient.errDob")).refine((d) => Date.parse(d) < Date.parse("2026-10-16") && Date.parse(d) > Date.parse("1900-01-01"), t("addPatient.errDob")),
    sex: z.enum(["f", "m"]),
    packYears: z.string().regex(/^\d{1,3}(\.\d)?$/, t("addPatient.errSmoking")),
    phone: z.string().trim().max(40).optional(),
    email: z.string().email(t("addPatient.errEmail")).optional().or(z.literal("")),
    gold: z.string().optional(),
    ratio: z.string().max(10).optional(),
  }).refine((v) => v.phone || v.email, { path: ["phone"], message: t("addPatient.errContact") })
    .refine((v) => status === "at_risk" || v.gold, { path: ["gold"], message: t("addPatient.errGold") });
  type Values = z.infer<typeof schema>;

  const { register, handleSubmit, getValues, reset, setFocus, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { sex: "f", gold: "2" } });

  useEffect(() => {
    try { const raw = sessionStorage.getItem(DRAFT_KEY); if (raw) reset(JSON.parse(raw)); } catch {}
  }, [reset]);

  const close = () => { setOpen(false); router.push("/patients"); };

  async function submit(v: Values) {
    setError(false);
    const res = await fetch("/api/patients", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: v.name, dob: v.dob, sex: v.sex, packYears: Number(v.packYears), phone: v.phone || undefined, email: v.email || undefined, status, gold: status === "diagnosed" ? Number(v.gold) : undefined, ratio: v.ratio || undefined }),
    });
    if (!res.ok) return setError(true);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    setSaved(await res.json());
    setStep(2);
    router.refresh();
  }

  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(getValues())); setDraftNote(true); } catch {}
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content onOpenAutoFocus={(e) => { e.preventDefault(); setFocus("name"); }} className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-48px)] w-[800px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-shell bg-surface p-8 outline-none">
          <div className="flex items-start justify-between pb-2 pt-3">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="font-display text-[26px] font-medium leading-[1.2] tracking-[-0.03em]">{step === 1 ? t("addPatient.title") : t("addPatient.inviteTitle", { name: saved?.patient.name.split(" ")[0] ?? "" })}</Dialog.Title>
              <Dialog.Description className="text-[12px] text-ink-muted">{t("addPatient.crumb1")} → {t("addPatient.crumb2")}</Dialog.Description>
            </div>
            <Dialog.Close aria-label={t("addPatient.close")} className="rounded-full p-2 text-ink-muted hover:bg-surface-soft"><X size={18} strokeWidth={1.8} /></Dialog.Close>
          </div>

          {step === 1 ? (
            <form noValidate onSubmit={handleSubmit(submit)} className="mt-4 flex flex-col gap-6">
              <p className="text-[12px] leading-[1.45] text-ink-muted">{t("addPatient.required")}</p>
              {error && <Alert state="error" title={t("addPatient.saveError")} />}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("addPatient.name")} autoComplete="off" error={errors.name?.message} {...register("name")} />
                <Field label={t("addPatient.dob")} type="date" error={errors.dob?.message} {...register("dob")} />
                <SelectField label={t("addPatient.sex")} options={[{ value: "f", label: t("addPatient.sexOptions.f") }, { value: "m", label: t("addPatient.sexOptions.m") }]} {...register("sex")} />
                <Field label={t("addPatient.smoking")} inputMode="decimal" error={errors.packYears?.message} {...register("packYears")} />
                <Field label={t("addPatient.phone")} type="tel" autoComplete="off" error={errors.phone?.message} {...register("phone")} />
                <Field label={t("addPatient.email")} type="email" autoComplete="off" error={errors.email?.message} {...register("email")} />
              </div>
              <Tabs label={t("addPatient.title")} value={status} onChange={setStatus} tabs={[{ id: "diagnosed", label: t("addPatient.diagnosed") }, { id: "at_risk", label: t("addPatient.atRisk") }]} />
              <div className="grid grid-cols-2 gap-4">
                {status === "diagnosed" ? (
                  <SelectField label={t("addPatient.gold")} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: t("addPatient.goldN", { n }) }))} error={errors.gold?.message} {...register("gold")} />
                ) : <div />}
                <Field label={t("addPatient.ratio")} placeholder="0.64" {...register("ratio")} />
              </div>
              <Alert title={t("addPatient.planTitle")}>{status === "diagnosed" ? t("addPatient.planDiagnosed") : t("addPatient.planAtRisk")}</Alert>
              {draftNote && <p role="status" className="text-[12px] text-ink-muted">{t("addPatient.draftSaved")}</p>}
              <div className="flex items-center justify-between">
                <Button onClick={close}>{t("addPatient.cancel")}</Button>
                <div className="flex gap-[10px]">
                  <Button onClick={saveDraft}>{t("addPatient.draft")}</Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting}>{t("addPatient.saveInvite")}</Button>
                </div>
              </div>
            </form>
          ) : (
            saved && <InviteStep saved={saved} onDone={close} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InviteStep({ saved, onDone }: { saved: Saved; onDone: () => void }) {
  const { t } = useT();
  const first = saved.patient.name.split(" ")[0];
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const link = `${window.location.origin}/r/${saved.token}`;
    setUrl(link);
    QRCode.toDataURL(link, { margin: 1, width: 190, color: { dark: "#111214", light: "#ffffff" } }).then(setQr);
  }, [saved.token]);
  const msg = encodeURIComponent(t("addPatient.inviteMessage", { first, url }));

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-[16px] bg-cobalt-tint p-4">
        <CircleCheck size={20} strokeWidth={1.8} className="mt-0.5 text-cobalt" aria-hidden />
        <div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("addPatient.savedTitle")}</p><p className="text-[12px] text-ink-muted">{t("addPatient.savedBody", { name: saved.patient.name, code: saved.patient.code })}</p></div>
      </div>
      <div className="flex gap-8">
        <div className="w-[190px] shrink-0">{qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt={t("addPatient.link")} width={190} height={190} className="rounded-[4px] shadow-[inset_0_0_0_1px_var(--line)]" />}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <h3 className="text-[18px] font-medium tracking-[-0.01em]">{t("addPatient.connectTitle")}</h3>
          <p className="text-[13px] leading-[1.45] text-ink-muted">{t("addPatient.connectBody")}</p>
          <div className="flex flex-wrap gap-[10px]">
            <Button variant="primary" href={`https://wa.me/?text=${msg}`}>{t("addPatient.whatsapp")}</Button>
            <Button href={`sms:?body=${msg}`}>{t("addPatient.sms")}</Button>
            <Button href={`mailto:?subject=SpiroAI&body=${msg}`}>{t("addPatient.emailBtn")}</Button>
          </div>
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="invite-link" className="text-[12px] font-medium">{t("addPatient.link")}</label>
            <div className="flex gap-2">
              <input id="invite-link" readOnly value={url} className="min-h-[46px] min-w-0 flex-1 rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none" />
              <Button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); }}>{copied ? <><Check size={14} /> {t("addPatient.copied")}</> : t("addPatient.copy")}</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-panel bg-cobalt-tint p-6">
        <h3 className="text-[18px] font-medium">{t("addPatient.nextTitle")}</h3>
        <ol className="mt-4 list-inside list-decimal text-[13px] leading-[1.45]"><li>{t("addPatient.next1", { first })}</li><li>{t("addPatient.next2")}</li><li>{t("addPatient.next3")}</li></ol>
      </div>
      <p className="flex items-center gap-2 text-[12px] text-ink-muted"><Info size={14} aria-hidden />{t("addPatient.reminder")}</p>
      <div className="flex items-center justify-between">
        <Button href={`/patients/${saved.patient.id}/monitoring`}>{t("addPatient.editPlan")}</Button>
        <Button variant="primary" onClick={onDone}>{t("addPatient.done")}</Button>
      </div>
    </div>
  );
}
