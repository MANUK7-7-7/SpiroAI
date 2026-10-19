"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { idleOptions } from "@/config/settings";
import type { SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

export type AuditRow = { id: string; when: string; line: string };

export function SecurityForm({ initial, audit }: { initial: SettingsData["security"]; audit: AuditRow[] }) {
  const { t } = useT();
  const { draft, update, save, state } = useSection("security", initial);
  const [ended, setEnded] = useState(false);
  const [tfaNote, setTfaNote] = useState(false);
  const logoutAll = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };
  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("settings.security.title")} sub={t("settings.security.sub")}>
        <div className="flex items-center justify-between gap-4 rounded-[16px] bg-surface-soft p-4">
          <div className="leading-[1.45]"><p className="text-[14px] font-medium tracking-[-0.01em]">{t("settings.security.tfa")}</p><p className="text-[12px] text-ink-muted">{t("settings.security.tfaDesc")}</p></div>
          <Button size="sm" radius="lg" onClick={() => setTfaNote((v) => !v)}>{t("settings.security.manage")}</Button>
        </div>
        {tfaNote && <Alert state="warning" title={t("settings.security.tfaWarn")} />}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-[0.06em] text-ink-muted">{t("settings.security.sessions")}</p>
          {[{ k: "thisDevice", l: "lastNow", own: true }, ...(ended ? [] : [{ k: "tablet", l: "lastTablet", own: false }])].map((s) => (
            <div key={s.k} className="flex items-center justify-between gap-4 rounded-[16px] bg-surface-soft p-3">
              <div className="leading-[1.45]"><p className="text-[14px] font-medium tracking-[-0.01em]">{t(`settings.security.${s.k}`)}</p><p className="text-[12px] text-ink-muted">{t(`settings.security.${s.l}`)}</p></div>
              {!s.own && <Button size="sm" radius="lg" onClick={() => setEnded(true)}>{t("settings.security.end")}</Button>}
            </div>
          ))}
        </div>
        <SelectField className="max-w-[260px]" label={t("settings.security.idle")} value={String(draft.idleMinutes)} onChange={(e) => update({ idleMinutes: Number(e.target.value) })} options={idleOptions.map((m) => ({ value: String(m), label: t("settings.security.minutes", { n: m }) }))} />
        <SaveBar label={t("settings.security.save")} state={state} onSave={save} onRetry={save}><Button onClick={logoutAll}>{t("settings.security.logoutAll")}</Button></SaveBar>
      </Panel>
      <Card className="gap-3 p-6">
        <div className="leading-[1.45]"><h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("settings.security.auditTitle")}</h2><p className="text-[12px] text-ink-muted">{t("settings.security.auditSub")}</p></div>
        {audit.length === 0 ? <p className="text-[12px] text-ink-muted">{t("settings.security.auditEmpty")}</p> : (
          <ul className="flex flex-col gap-1 font-mono text-[12px] leading-[1.6] text-ink-muted">{audit.map((a) => <li key={a.id}>{a.when} · {a.line}</li>)}</ul>
        )}
        <div><Link href="/settings/security/audit" className="inline-flex h-[34px] items-center rounded-[18px] border border-line bg-surface px-3 text-[12px] font-medium tracking-[-0.01em] hover:bg-surface-soft">{t("settings.security.viewFull")}</Link></div>
      </Card>
    </div>
  );
}
