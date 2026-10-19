"use client";

import { BookOpen, LifeBuoy } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

export function HelpForm({ initial }: { initial: SettingsData["help"] }) {
  const { t } = useT();
  const { draft, update, save, state } = useSection("help", initial);
  return (
    <Panel title={t("settings.help.title")} sub={t("settings.help.sub")}>
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Card tint className="gap-3 p-5"><BookOpen size={20} className="text-cobalt" aria-hidden /><div className="leading-[1.45]"><h3 className="text-[16px] font-medium">{t("settings.help.guide")}</h3><p className="text-[12px] text-ink-muted">{t("settings.help.guideDesc")}</p></div><div><Button size="sm" radius="lg" href="/how-it-works">{t("settings.help.openGuide")}</Button></div></Card>
        <Card className="gap-3 p-5"><LifeBuoy size={20} className="text-cobalt" aria-hidden /><div className="leading-[1.45]"><h3 className="text-[16px] font-medium">{t("settings.help.contact")}</h3><p className="text-[12px] text-ink-muted">{t("settings.help.contactDesc")} · {t("settings.help.hours")}</p></div><div><Button size="sm" radius="lg" href="mailto:support@spiro.example">{t("settings.help.contactBtn")}</Button></div></Card>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[16px] font-medium tracking-[-0.01em]">{t("settings.help.faq")}</h3>
        {(["1", "2", "3"] as const).map((n) => (
          <details key={n} className="group rounded-[16px] bg-surface-soft p-4">
            <summary className="cursor-pointer text-[14px] font-medium tracking-[-0.01em]">{t(`settings.help.q${n}`)}</summary>
            <p className="mt-2 text-[12px] leading-[1.45] text-ink-muted">{t(`settings.help.a${n}`)}</p>
          </details>
        ))}
      </div>
      <div className="flex flex-wrap gap-[10px]">
        <Button size="sm" radius="lg" href="/how-it-works#terms">{t("settings.help.terms")}</Button>
        <Button size="sm" radius="lg" href="/how-it-works#privacy">{t("settings.help.privacy")}</Button>
        <Button size="sm" radius="lg" href="/how-it-works#disclaimer">{t("settings.help.disclaimer")}</Button>
      </div>
      <Switch checked={draft.tips} onCheckedChange={(v) => update({ tips: v })} label={t("settings.help.tips")} description={t("settings.help.tipsDesc")} />
      <SaveBar label={t("settings.help.save")} state={state} onSave={save} onRetry={save} />
      <Alert state="info" title={t("settings.help.boundaryTitle")}>{t("settings.help.boundaryBody")}</Alert>
    </Panel>
  );
}
