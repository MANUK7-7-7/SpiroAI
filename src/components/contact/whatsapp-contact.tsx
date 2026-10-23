"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { openInNewTab } from "@/lib/whatsapp";

const templates = ["free", "quiet", "book", "stable"] as const;

type Props = { patientId: string; firstName: string; hasPhone: boolean; locked?: boolean; look?: "button" | "link"; className?: string };

/** Contacting a patient opens WhatsApp with a short template. Nothing clinical should go in the message. */
export function WhatsAppContact({ patientId, firstName, hasPhone, locked, look = "button", className }: Props) {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  const disabled = !hasPhone || locked;
  const why = locked ? t("contact.locked") : !hasPhone ? t("contact.noPhone") : undefined;

  async function open(tpl: (typeof templates)[number]) {
    setFailed(false);
    const text = t(`contact.tpl.${tpl}`, { first: firstName });
    const ok = await openInNewTab(async () => {
      const res = await fetch(`/api/patients/${patientId}/contact`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, template: tpl }) }).catch(() => null);
      return res?.ok ? ((await res.json()) as { url: string }).url : null;
    });
    if (!ok) setFailed(true);
  }

  const trigger = look === "link"
    ? cn("text-left text-cobalt disabled:text-ink-muted", className)
    : cn("inline-flex h-[34px] items-center gap-2 whitespace-nowrap rounded-input border border-line bg-surface px-3 text-[12px] font-medium tracking-[-0.01em] text-ink hover:bg-surface-soft disabled:cursor-not-allowed disabled:text-ink-muted", className);

  return (
    <DM.Root>
      <DM.Trigger disabled={disabled} title={why} aria-label={why ? `${t("contact.whatsapp")} · ${why}` : undefined} className={trigger}>
        {look === "button" && <MessageCircle size={14} strokeWidth={1.8} aria-hidden />}{t("contact.whatsapp")}
      </DM.Trigger>
      {failed && <span role="alert" className="sr-only">{t("contact.error")}</span>}
      <DM.Portal>
        <DM.Content align="start" sideOffset={6} className="z-50 w-[300px] rounded-[18px] bg-surface p-1.5 shadow-[0_8px_30px_rgb(14_16_20/0.12),inset_0_0_0_1px_var(--line)]">
          <DM.Label className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("contact.pick")}</DM.Label>
          {templates.map((k) => (
            <DM.Item key={k} onSelect={() => void open(k)} className="cursor-pointer rounded-input px-3 py-2 text-[13px] outline-none data-[highlighted]:bg-surface-soft">
              {t(`contact.label.${k}`)}
            </DM.Item>
          ))}
          <p className="px-3 pb-2 pt-1 text-[11px] leading-[1.45] text-ink-muted">{t("contact.privacy")}</p>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
