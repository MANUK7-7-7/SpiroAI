import { CircleCheck } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { Title } from "@/components/ui/title";
import { GeneratingCard } from "@/components/export/export-modal";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const screens = ["s11", "s12", "s13", "s14"] as const;

export default async function AlertsStateLibrary() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 rounded-shell bg-surface-sunken p-10">
      <Brand shape="pill" />
      <div className="flex flex-col gap-2"><Title size={40}>{t("states.flowC.title")}</Title><p className="text-[14px] text-ink-muted">{t("states.flowC.sub")}</p></div>
      {screens.map((s) => (
        <section key={s} className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t(`states.flowC.${s}.title`)}</h2>
          <div className="grid grid-cols-4 gap-4">
            <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: s.toUpperCase() })} />
            <StateCard kind="empty" tag={t("states.empty")} message={t(`states.flowC.${s}.empty`)} action={t(`states.flowC.${s}.emptyAction`)} />
            <StateCard kind="error" tag={t("states.error")} message={t(`states.flowC.${s}.error`)} action={t("states.retry")} />
            <StateCard kind="success" tag={t("states.success")} message={t(`states.flowC.${s}.success`)} note={t("states.recorded")} />
          </div>
        </section>
      ))}
      <h2 className="font-display text-[28px] font-medium tracking-[-0.035em]">{t("states.flowC.follow")}</h2>
      <div className="grid grid-cols-2 gap-5">
        <Card className="rounded-panel">
          <CardHeading title={t("states.flowC.confTitle")} />
          <div className="flex items-start gap-3 rounded-[16px] bg-cobalt-tint p-4"><CircleCheck size={20} strokeWidth={1.6} className="mt-0.5 text-cobalt" aria-hidden /><div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("states.flowC.confAlert")}</p><p className="text-[12px] text-ink-muted">{t("states.flowC.confBody")}</p></div></div>
          <div><span className="inline-flex h-[34px] items-center rounded-full bg-ink px-4 text-[12px] font-medium text-on-accent">{t("states.flowC.pendingChip")}</span></div>
          <div><Button size="sm" radius="lg" href="/patients/p-001">{t("states.flowC.viewProfile")}</Button></div>
          <p className="text-[11px] text-ink-muted">{t("states.flowC.returnNote")}</p>
        </Card>
        <Card className="rounded-panel">
          <CardHeading title={t("states.flowC.genTitle")} />
          <GeneratingCard t={t} progress={68} />
          <p className="text-[11px] text-ink-muted">{t("states.flowC.auditExport")}</p>
        </Card>
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.sampleFooter")}</p>
    </div>
  );
}
