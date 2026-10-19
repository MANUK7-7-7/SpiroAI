"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

type Props = { patientId: string; first: string; locked: boolean; lastDelivery?: "sent" | "delivered" | "read"; resultAttach?: string };

/** Quick templates and a free-text message. Sending is always a clinician action. */
export function Composer({ patientId, first, locked, lastDelivery, resultAttach }: Props) {
  const { t } = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [template, setTemplate] = useState<string>();
  const [attached, setAttached] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const tpls = [["tplQuiet", "quiet"], ["tplBook", "book"], ["tplStable", "stable"]] as const;

  async function send() {
    if (!text.trim() || locked) return;
    setState("sending");
    const body = `${text}${attached && resultAttach ? `\n${resultAttach}` : ""}${template ? `\n\n${t("messages.emergencyLine")}` : ""}`;
    const res = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId, text: body, template }) });
    if (!res.ok) return setState("error");
    setText(""); setTemplate(undefined); setAttached(false); setState("idle");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("messages.templates")}</p>
      <div className="flex flex-wrap gap-[10px]">
        {tpls.map(([k, id]) => (
          <button key={k} type="button" disabled={locked} onClick={() => { setText(t(`messages.${k}Text`, { first })); setTemplate(id); }} className="rounded-full bg-surface-soft px-4 py-[10px] text-[12px] hover:bg-cobalt-tint disabled:opacity-50">{t(`messages.${k}`)}</button>
        ))}
      </div>
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="msg-body" className="text-[12px] font-medium">{t("messages.message")}</label>
        <textarea id="msg-body" rows={3} value={text} disabled={locked} onChange={(e) => { setText(e.target.value); setState("idle"); }} placeholder={t("messages.messagePh")} maxLength={1500} className="min-h-[88px] w-full resize-y rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-ink-muted focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--cobalt)] disabled:opacity-60" />
      </div>
      {state === "error" && <Alert state="error" title={t("messages.sendError")} />}
      <div className="flex items-center justify-between gap-4">
        <Button size="sm" radius="lg" onClick={() => setAttached(!attached)} disabled={!resultAttach || locked}>{attached ? t("messages.attached") : t("messages.attach")}</Button>
        <p className="text-[11px] text-ink-muted">{lastDelivery === "read" ? t("messages.deliveredRead") : lastDelivery ? t("messages.delivered") : ""}</p>
        <button type="button" onClick={send} disabled={!text.trim() || locked || state === "sending"} className="inline-flex h-11 items-center gap-3 rounded-input bg-cobalt pl-5 pr-[5px] text-[14px] font-medium text-on-accent hover:bg-cobalt-deep disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted">
          <Send size={16} strokeWidth={1.8} aria-hidden />
          {state === "sending" ? t("messages.sending") : t("messages.send")}
          <span className="flex size-[34px] items-center justify-center rounded-full bg-surface text-cobalt"><span aria-hidden>↗</span></span>
        </button>
      </div>
    </div>
  );
}
