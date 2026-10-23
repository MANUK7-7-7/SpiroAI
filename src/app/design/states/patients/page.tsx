import { Brand } from "@/components/ui/brand";
import { StateCard } from "@/components/ui/state-card";
import { Title } from "@/components/ui/title";
import { ConnectedBanner, DuplicateCard, FirstPatientCard, InactiveRevokedCard, InvitePendingCard } from "@/components/patients/safeguards";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const screens = ["s05", "s06", "s07", "s08", "s09", "s10"] as const;

export default async function PatientsStateLibrary() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-8 rounded-shell bg-surface-sunken p-10">
      <Brand shape="pill" />
      <div className="flex flex-col gap-2"><Title size={40}>{t("states.flowB.title")}</Title><p className="text-[14px] text-ink-muted">{t("states.flowB.sub")}</p></div>
      {screens.map((s) => (
        <section key={s} className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t(`states.flowB.${s}.title`)}</h2>
          <div className="grid grid-cols-4 gap-4">
            <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: s.toUpperCase() })} />
            <StateCard kind="empty" tag={t("states.empty")} message={t(`states.flowB.${s}.empty`)} action={t(`states.flowB.${s}.emptyAction`)} />
            <StateCard kind="error" tag={t("states.error")} message={t(`states.flowB.${s}.error`)} action={t("states.retry")} />
            <StateCard kind="success" tag={t("states.success")} message={t(`states.flowB.${s}.success`)} note={t("states.recorded")} />
          </div>
        </section>
      ))}
      <h2 className="font-display text-[28px] font-medium tracking-[-0.035em]">{t("states.flowB.safeguards")}</h2>
      <div className="grid grid-cols-3 gap-5"><FirstPatientCard t={t} /><DuplicateCard t={t} /><InactiveRevokedCard t={t} /></div>
      <div className="grid grid-cols-2 gap-5"><ConnectedBanner t={t} /><InvitePendingCard t={t} /></div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.sampleFooter")}</p>
    </div>
  );
}
