"use client";

import { MessageCircle, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Priority } from "@/config/triage";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { openInNewTab } from "@/lib/whatsapp";

type Slot = { id: string; label: string };

async function post(id: string, body: unknown) {
  const res = await fetch(`/api/triage/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

/** Re-renders the page until the voice analysis is back; the priority updates on its own. */
export function VoicePoll({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/triage/${id}`).catch(() => null);
      const j = res?.ok ? ((await res.json()) as { voiceState: string }) : null;
      if ((j && j.voiceState !== "processing") || ++n > 30) { clearInterval(timer); router.refresh(); }
    }, 1500);
    return () => clearInterval(timer);
  }, [id, router]);
  return null;
}

/** Booking is a clinician action. High priority books by default; medium and low can be referred anyway. */
export function BookingPanel({ id, priority, slots, canRetriage }: { id: string; priority: Priority; slots: Slot[]; canRetriage: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(priority === "high");
  const [slot, setSlot] = useState<string>();
  const [worsening, setWorsening] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  async function book() {
    if (!slot) return;
    setState("saving");
    if (!(await post(id, { action: "refer", slotId: slot, worsening }))) return setState("error");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!open ? (
        <div className="flex flex-wrap gap-[10px]">
          {canRetriage && <Button variant="primary" onClick={async () => { if (await post(id, { action: "retriage" })) router.refresh(); }}>{t("triage.retriage")}</Button>}
          <Button onClick={() => setOpen(true)}>{t("triage.referAnyway")}</Button>
        </div>
      ) : (
        <>
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("triage.slots")}</p>
          {slots.length === 0 ? <Alert state="warning" title={t("triage.noSlots")} /> : (
            <div role="radiogroup" aria-label={t("triage.slots")} className="grid grid-cols-3 gap-2 max-lg:grid-cols-2">
              {slots.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={slot === s.id} onClick={() => setSlot(s.id)}
                  className={cn("rounded-input px-3 py-3 text-left text-[13px]", slot === s.id ? "bg-ink text-on-accent" : "bg-surface-soft hover:bg-surface-sunken")}>{s.label}</button>
              ))}
            </div>
          )}
          {priority !== "high" && <Checkbox label={t("triage.worsening")} checked={worsening} onCheckedChange={setWorsening} />}
          {state === "error" && <Alert state="error" title={t("settings.save.error")} />}
          <div className="flex flex-wrap gap-[10px]">
            <Button variant="primary" onClick={book} disabled={!slot || state === "saving"}>{t("triage.book")}</Button>
            {priority !== "high" && <Button onClick={() => setOpen(false)}>{t("triage.back")}</Button>}
          </div>
        </>
      )}
    </div>
  );
}

/** The appointment message carries only the date and place, never the condition. */
export function AppointmentShare({ patientId, text, hasPhone, slipHref }: { patientId: string; text: string; hasPhone: boolean; slipHref: string }) {
  const { t } = useT();
  async function whatsapp() {
    await openInNewTab(async () => {
      const res = await fetch(`/api/patients/${patientId}/contact`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, template: "referral" }) }).catch(() => null);
      return res?.ok ? ((await res.json()) as { url: string }).url : null;
    });
  }
  return (
    <div className="flex flex-wrap gap-[10px]">
      {hasPhone && <Button variant="primary" arrow={false} onClick={whatsapp}><MessageCircle size={16} aria-hidden />{t("triage.sendWhatsapp")}</Button>}
      <Button href={slipHref}><Printer size={16} aria-hidden />{t("triage.printSlip")}</Button>
    </div>
  );
}

export function StartMonitoring({ id }: { id: string }) {
  const { t } = useT();
  const router = useRouter();
  return <Button variant="primary" onClick={async () => { if (await post(id, { action: "monitor" })) router.refresh(); }}>{t("triage.startMonitoring")}</Button>;
}

export function HospitalEntry({ id }: { id: string }) {
  const { t } = useT();
  const router = useRouter();
  const [ratio, setRatio] = useState("");
  const [err, setErr] = useState(false);
  async function save(body: unknown) {
    const res = await fetch(`/api/hospital/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) router.refresh(); else setErr(true);
  }
  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const r = Number(ratio.replace(",", ".")); if (!(r >= 0.2 && r <= 1.2)) return setErr(true); void save({ status: "done", ratio: r }); }}>
      <label className="sr-only" htmlFor={`r-${id}`}>{t("triage.ratioLabel")}</label>
      <input id={`r-${id}`} inputMode="decimal" placeholder="0.68" value={ratio} onChange={(e) => { setRatio(e.target.value); setErr(false); }} aria-invalid={err}
        className={cn("h-[34px] w-[90px] rounded-input bg-surface-soft px-3 text-[13px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--cobalt)]", err && "shadow-[inset_0_0_0_1px_var(--risk-high)]")} />
      <Button size="sm" variant="primary" type="submit" radius="lg">{t("triage.save")}</Button>
      <Button size="sm" radius="lg" onClick={() => save({ status: "no_show" })}>{t("triage.noShow")}</Button>
      {err && <span role="alert" className="text-[11px] text-risk-high">{t("triage.ratioError")}</span>}
    </form>
  );
}
