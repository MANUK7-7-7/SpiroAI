"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";

/** Dismissing always requires a reason. The alert moves to Resolved; the result and history are not deleted. */
export function DismissAlert({ alertId, sub }: { alertId: string; sub: string }) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error" | "short">("idle");

  async function submit() {
    if (reason.trim().length < 5) return setState("short");
    setState("saving");
    const res = await fetch(`/api/alerts/${alertId}/dismiss`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
    if (!res.ok) return setState("error");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setState("idle"); }}>
      <Dialog.Trigger asChild><Button size="sm" radius="lg">{t("alertsCenter.dismiss")}</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-48px)] w-[872px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-shell bg-surface-sunken p-8 outline-none">
          <Card className="rounded-panel p-6">
            <div>
              <Dialog.Title className="text-[20px] font-medium tracking-[-0.01em]">{t("alertsCenter.dismissTitle")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] text-ink-muted">{sub}</Dialog.Description>
            </div>
            <Alert state="warning" title={t("alertsCenter.dismissAlertTitle")}>{t("alertsCenter.dismissAlertBody")}</Alert>
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="dismiss-reason" className="text-[12px] font-medium">{t("alertsCenter.reasonLabel")}</label>
              <textarea id="dismiss-reason" value={reason} onChange={(e) => { setReason(e.target.value); setState("idle"); }} rows={3} maxLength={500} aria-invalid={state === "short"} className="min-h-[88px] w-full resize-y rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" />
              {state === "short" && <p className="text-[11px] text-risk-high">{t("alertsCenter.reasonErr")}</p>}
            </div>
            <p className="text-[12px] text-ink-muted">{t("alertsCenter.dismissedBy", { who: "Dr. Elena Morales" })}</p>
            {state === "error" && <Alert state="error" title={t("alertsCenter.dismissError")} />}
            <div className="flex gap-3">
              <Dialog.Close asChild><Button>{t("alertsCenter.keepOpen")}</Button></Dialog.Close>
              <Button variant="primary" onClick={submit} disabled={state === "saving"}>{t("alertsCenter.dismissAndResolve")}</Button>
            </div>
          </Card>
          <Card className="rounded-panel p-6">
            <CardHeading title={t("alertsCenter.otherRoutes")} />
            <div className="text-[13px] leading-[1.45]"><p>{t("alertsCenter.watch")}</p><p>{t("alertsCenter.act")}</p></div>
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type Ev = { id: string; at: string; actor: string; action: string; detail?: string };

export function AuditTrail({ alertId }: { alertId: string }) {
  const { t, locale } = useT();
  const [events, setEvents] = useState<Ev[] | null>(null);
  async function load() {
    const res = await fetch(`/api/alerts/${alertId}/audit`);
    setEvents(res.ok ? (await res.json()).events : []);
  }
  return (
    <Dialog.Root onOpenChange={(o) => o && load()}>
      <Dialog.Trigger asChild><Button size="sm" radius="pill">{t("alertsCenter.auditTrail")}</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-shell bg-surface p-8 outline-none">
          <Dialog.Title className="text-[20px] font-medium">{t("alertsCenter.auditTitle")}</Dialog.Title>
          <Dialog.Description className="sr-only">{t("alertsCenter.auditTitle")}</Dialog.Description>
          <ul className="mt-4 flex flex-col gap-3">
            {events === null && <li className="text-[12px] text-ink-muted">…</li>}
            {events?.length === 0 && <li className="text-[12px] text-ink-muted">{t("alertsCenter.auditEmpty")}</li>}
            {events?.map((e) => (
              <li key={e.id} className="rounded-[16px] bg-surface-soft p-3 text-[12px] leading-[1.45]">
                <p className="font-mono text-[11px] text-ink-muted">{new Date(e.at).toLocaleString(locale === "es" ? "es-AR" : "en-GB", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
                <p><span className="font-medium">{e.action}</span> · {e.actor}{e.detail ? ` · ${e.detail}` : ""}</p>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
