import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function HowItWorks() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-7 rounded-shell bg-surface-sunken p-12">
      <Brand />
      <Card>
        <CardHeading title={t("howItWorks.title")} description={t("howItWorks.subtitle")} />
        <ol className="flex gap-5">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex min-w-0 flex-1 flex-col gap-5 rounded-item bg-surface-soft p-5 leading-[1.45]">
              <span className="font-display text-[30px] font-medium tracking-[-0.04em] text-cobalt">{`0${i + 1}`}</span>
              <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{t(`howItWorks.steps.${i}.title`)}</h3>
              <p className="text-[14px] tracking-[-0.005em] text-ink-muted">{t(`howItWorks.steps.${i}.body`)}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45] tracking-[-0.005em]">
          <div className="flex flex-wrap gap-5 text-ink-muted">
            <p>{t("howItWorks.confidence")}</p>
            <p>{t("howItWorks.quality")}</p>
          </div>
          <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
          <p className="text-ink-muted">{t("howItWorks.judgment")}</p>
        </div>
        <div><Button href="/signup/account" variant="primary">{t("howItWorks.create")}</Button></div>
      </Card>
      <p className="text-[12px] leading-[1.45] text-ink-muted">{t("howItWorks.note")}</p>
    </div>
  );
}
