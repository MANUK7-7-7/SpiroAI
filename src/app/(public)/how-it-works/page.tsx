import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { TryPrototypeButton } from "@/components/auth/try-prototype-button";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const STEPS = [0, 1, 2, 3] as const;

/** The referral loop in four steps: triage, priority, booking, result back. Same story as the report. */
export default async function HowItWorks() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-5 bg-surface-sunken p-3 sm:gap-7 sm:p-8 lg:rounded-shell lg:p-12">
      <Link href="/" aria-label="SpiroAI"><Brand /></Link>
      <Card>
        <CardHeading title={t("howItWorks.title")} description={t("howItWorks.subtitle")} />
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((i) => (
            <li key={i} className="flex min-w-0 flex-col gap-3 rounded-item bg-surface-soft p-5 leading-[1.45] lg:gap-5">
              <span className="font-display text-[30px] font-medium tracking-[-0.04em] text-cobalt">{`0${i + 1}`}</span>
              <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{t(`howItWorks.steps.${i}.title`)}</h3>
              <p className="text-[14px] tracking-[-0.005em] text-ink-muted">{t(`howItWorks.steps.${i}.body`)}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45] tracking-[-0.005em]">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-ink-muted">
            <p>{t("howItWorks.confidence")}</p>
            <p>{t("howItWorks.quality")}</p>
          </div>
          <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
          <p className="text-ink-muted">{t("howItWorks.judgment")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <TryPrototypeButton className="w-full sm:w-auto" />
          <TryPrototypeButton role="agent" variant="secondary" className="w-full !border-cobalt !text-cobalt sm:w-auto" />
          <Button href="/signup/account" className="w-full sm:w-auto">{t("howItWorks.create")}</Button>
        </div>
      </Card>
      <p className="px-2 text-[12px] leading-[1.45] text-ink-muted sm:px-0">{t("howItWorks.note")}</p>
    </div>
  );
}
