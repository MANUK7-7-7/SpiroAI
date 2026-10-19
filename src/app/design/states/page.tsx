import { Alert } from "@/components/ui/alert";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { StateCard } from "@/components/ui/state-card";
import { Title } from "@/components/ui/title";
import { getT } from "@/lib/i18n/server";

const screens = ["s01", "s02", "s03", "s04"] as const;

export default async function StateLibrary() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 rounded-shell bg-surface-sunken p-10">
      <Brand shape="pill" />
      <div className="flex flex-col gap-2">
        <Title size={40}>{t("states.boardTitle")}</Title>
        <p className="text-[14px] text-ink-muted">{t("states.boardSubtitle")}</p>
      </div>
      {screens.map((s) => (
        <section key={s} className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{t(`states.flowA.${s}.title`)}</h2>
          <div className="grid grid-cols-4 gap-4">
            <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: s.toUpperCase() })} />
            <StateCard kind="empty" tag={t("states.empty")} message={t(`states.flowA.${s}.empty`)} action={t(`states.flowA.${s}.emptyAction`)} />
            <StateCard kind="error" tag={t("states.error")} message={t(`states.flowA.${s}.error`)} action={t("states.retry")} />
            <StateCard kind="success" tag={t("states.success")} message={t(`states.flowA.${s}.success`)} note={t("states.recorded")} />
          </div>
        </section>
      ))}
      <h2 className="font-display text-[28px] font-medium tracking-[-0.035em]">{t("states.validationTitle")}</h2>
      <div className="grid grid-cols-3 gap-5">
        <Card className="rounded-panel p-6">
          <h3 className="text-[18px] font-medium">{t("states.blurTitle")}</h3>
          <Field label={t("signup.account.email")} defaultValue="elena@" error={t("states.blurError")} readOnly />
          <Alert state="warning" title={t("states.dupTitle")}>{t("states.dupBody")}</Alert>
          <div><Button size="sm" radius="pill" href="/login">{t("common.login")}</Button></div>
          <div><Button disabled>{t("states.submitting")}</Button></div>
          <p className="text-[11px] text-ink-muted">{t("states.submitNote")}</p>
        </Card>
        <Card className="rounded-panel p-6">
          <h3 className="text-[18px] font-medium">{t("states.outcomesTitle")}</h3>
          <Alert state="success" title={t("states.verifiedTitle")}>{t("states.verifiedBody")}</Alert>
          <div><Button variant="primary" size="sm" radius="pill" href="/dashboard">{t("states.goDashboard")}</Button></div>
          <Alert state="info" title={t("states.pendingTitle")}>{t("states.pendingBody")}</Alert>
          <Alert state="error" title={t("states.rejectedTitle")}>{t("states.rejectedBody")}</Alert>
          <div><Button size="sm" radius="pill" href="/signup/professional">{t("states.editDetails")}</Button></div>
        </Card>
        <Card className="rounded-panel p-6">
          <h3 className="text-[18px] font-medium">{t("states.lockTitle")}</h3>
          <Alert state="warning" title={t("states.moreTitle")}>{t("states.moreBody")}</Alert>
          <div><Button size="sm" radius="pill">{t("pending.upload.button")}</Button></div>
          <Alert state="error" title={t("states.tooMany")}>{t("states.tooManyBody")}</Alert>
          <Alert state="info" title={t("states.expiredTitle")}>{t("states.expiredBody")}</Alert>
          <div><Button variant="primary" size="sm" radius="pill" href="/login">{t("states.loginSecurely")}</Button></div>
        </Card>
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.sampleFooter")}</p>
    </div>
  );
}
