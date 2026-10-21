"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TEST_LINK_TTL_DAYS } from "@/config/recording";
import { formatDayYear } from "@/lib/format";
import { useT } from "@/lib/i18n/client";

type Props = { patientId: string; firstName: string; hasPhone: boolean; locked?: boolean };
type Link = { url: string; expiresAt: string; whatsappUrl: string | null };

/**
 * Asks a patient for one test: creates a single-use recording link and sends it on WhatsApp.
 * The result reaches the doctor as a notification when the patient finishes.
 */
export function SendTestLink({ patientId, firstName, hasPhone, locked }: Props) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<Link | null>(null);
  const [state, setState] = useState<"idle" | "creating" | "error">("idle");
  const [copied, setCopied] = useState(false);

  async function create() {
    setState("creating");
    const message = t("testLink.message", { first: firstName, days: TEST_LINK_TTL_DAYS, url: "{url}" });
    const res = await fetch(`/api/patients/${patientId}/test-link`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) }).catch(() => null);
    if (!res?.ok) return setState("error");
    setLink((await res.json()) as Link);
    setState("idle");
  }

  function sendOnWhatsApp() {
    if (!link?.whatsappUrl) return;
    if (!window.open(link.whatsappUrl, "_blank", "noopener")) window.location.href = link.whatsappUrl;
  }

  async function copy() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch { setCopied(false); }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setLink(null); setState("idle"); setCopied(false); } }}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="primary" disabled={locked}>{t("profile.requestTest")}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-48px)] w-[640px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-shell bg-surface-sunken p-8 outline-none">
          <Card className="gap-4 rounded-panel p-6">
            <div>
              <Dialog.Title className="text-[20px] font-medium tracking-[-0.01em]">{t("testLink.title", { first: firstName })}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] leading-[1.5] text-ink-muted">{t("testLink.body", { days: TEST_LINK_TTL_DAYS })}</Dialog.Description>
            </div>
            <ol className="list-inside list-decimal text-[13px] leading-[1.6]">
              <li>{t("testLink.step1", { first: firstName })}</li>
              <li>{t("testLink.step2")}</li>
              <li>{t("testLink.step3")}</li>
            </ol>
            {!hasPhone && <Alert state="warning" title={t("testLink.noPhone")} />}
            {state === "error" && <Alert state="error" title={t("testLink.error")} />}
            {!link ? (
              <div className="flex gap-3">
                <Dialog.Close asChild><Button>{t("testLink.cancel")}</Button></Dialog.Close>
                <Button variant="primary" onClick={create} disabled={state === "creating"}>{t("testLink.create")}</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-[7px]">
                  <label htmlFor="test-link" className="text-[12px] font-medium">{t("testLink.linkLabel")}</label>
                  <div className="flex gap-2">
                    <input id="test-link" readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} className="min-h-[46px] min-w-0 flex-1 rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none" />
                    <Button onClick={copy}>{copied ? <><Check size={14} aria-hidden /> {t("addPatient.copied")}</> : t("addPatient.copy")}</Button>
                  </div>
                  <p className="text-[11px] text-ink-muted">{t("testLink.expires", { date: formatDayYear(link.expiresAt, locale) })}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={sendOnWhatsApp} disabled={!link.whatsappUrl}><MessageCircle size={16} strokeWidth={1.8} aria-hidden />{t("testLink.send")}</Button>
                  <Dialog.Close asChild><Button>{t("testLink.done")}</Button></Dialog.Close>
                </div>
                <p className="text-[11px] leading-[1.45] text-ink-muted">{t("contact.privacy")}</p>
              </div>
            )}
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
