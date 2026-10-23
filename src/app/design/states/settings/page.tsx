import { Avatar } from "@/components/ui/avatar";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { Title } from "@/components/ui/title";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const sections = ["profile", "notifications", "thresholds", "team", "security", "help"] as const;

export default async function SettingsStateLibrary() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 rounded-shell bg-surface-sunken p-10">
      <Brand shape="pill" />
      <div className="flex flex-col gap-2"><Title size={40}>{t("settings.stateBoard.title")}</Title><p className="text-[14px] text-ink-muted">{t("settings.stateBoard.sub")}</p></div>
      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("settings.stateBoard.section")}</h2>
        <div className="grid grid-cols-4 gap-4">
          <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: "S16" })} />
          <StateCard kind="empty" tag={t("states.empty")} message={t("settings.stateBoard.empty")} action={t("settings.stateBoard.emptyAction")} />
          <StateCard kind="error" tag={t("states.error")} message={t("settings.stateBoard.error")} action={t("states.retry")} />
          <StateCard kind="success" tag={t("states.success")} message={t("settings.stateBoard.success")} note={t("states.recorded")} />
        </div>
        <p className="text-[12px] text-ink-muted">{t("settings.stateBoard.note")}</p>
        <ul className="flex flex-wrap gap-2">{sections.map((s) => <li key={s} className="rounded-full bg-surface px-3 py-1 text-[12px]">{t(`settings.nav.${s}`)}</li>)}</ul>
      </section>
      <div className="grid grid-cols-3 gap-5">
        <Card className="rounded-panel">
          <CardHeading title={t("settings.unsaved.title")} />
          <div className="leading-[1.45]"><p className="text-[16px] font-medium">{t("settings.unsaved.alert")}</p><p className="text-[12px] text-ink-muted">{t("settings.unsaved.body", { section: t("settings.nav.thresholds") })}</p></div>
          <div className="flex gap-[10px]"><Button size="sm" radius="lg">{t("settings.unsaved.discard")}</Button><Button size="sm" variant="primary" radius="lg">{t("settings.unsaved.save")}</Button></div>
        </Card>
        <Card className="rounded-panel">
          <CardHeading title={t("settings.team.pendingTitle")} />
          <div className="flex items-center gap-3"><Avatar initials="NP" /><div className="leading-[1.45]"><p className="text-[14px] font-medium">Nina Park</p><p className="text-[12px] text-ink-muted">{t("settings.team.pendingMeta")}</p></div></div>
          <div className="flex gap-[10px]"><Button size="sm" radius="lg">{t("settings.team.resend")}</Button><Button size="sm" radius="lg">{t("settings.team.cancelInvite")}</Button></div>
        </Card>
        <Card className="rounded-panel">
          <CardHeading title={t("settings.team.nurseState")} />
          <div className="leading-[1.45]"><p className="text-[14px] font-medium">{t("settings.team.nurseManaged")}</p><p className="text-[12px] text-ink-muted">{t("settings.team.nurseManagedBody")}</p></div>
          <div><Button size="sm" radius="lg" disabled>{t("settings.team.editPlanDoctor")}</Button></div>
        </Card>
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.sampleFooter")}</p>
    </div>
  );
}
