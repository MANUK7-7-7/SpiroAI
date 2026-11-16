import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { WelcomeVisual } from "@/components/layout/welcome-visual";
import { TryPrototypeButton } from "@/components/auth/try-prototype-button";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const tags = [
  ["remote", "tag-remote.svg"],
  ["alerts", "tag-alerts.svg"],
  ["missed", "tag-missed.svg"],
  ["licensed", "tag-licensed.svg"],
  ["consent", "tag-consent.svg"],
  ["judgment", "tag-judgment.svg"],
] as const;

/** On phones the panel stacks: text and buttons first, a short artwork band, then the tags. */
export default async function Welcome() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-[18px] bg-canvas px-3 pb-5 pt-3 sm:px-8 sm:pb-7 sm:pt-8 lg:rounded-shell">
      <div className="flex flex-col gap-6 overflow-hidden rounded-[28px] bg-surface p-5 sm:rounded-shell sm:p-8 lg:h-[940px] lg:flex-row lg:py-5 lg:pl-14 lg:pr-5">
        <div className="flex min-w-px flex-1 flex-col justify-between gap-8 lg:h-full lg:gap-0 lg:pb-9 lg:pt-6">
          <Brand />
          <div className="flex flex-col items-start gap-5 lg:gap-7">
            <p className="text-[12px] font-medium tracking-[0.06em] text-cobalt">{t("welcome.eyebrow")}</p>
            <h1 className="max-w-[610px] font-display text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-ink sm:text-[56px] lg:text-[72px] lg:leading-[0.98] lg:tracking-[-0.05em]">
              {t("welcome.headline")}
              <span className="text-cobalt">.</span>
            </h1>
            <p className="max-w-[470px] text-[16px] leading-[1.45] tracking-[-0.005em] text-ink-muted lg:text-[18px] lg:leading-[1.4]">{t("welcome.body")}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <TryPrototypeButton className="w-full sm:w-auto" />
              <TryPrototypeButton role="agent" variant="secondary" className="w-full !border-cobalt !text-cobalt sm:w-auto" />
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button href="/signup/account" className="w-full sm:w-auto">{t("welcome.create")}</Button>
              <Button href="/login" className="w-full sm:w-auto">{t("welcome.login")}</Button>
            </div>
            <Link href="/how-it-works" className="text-[14px] font-medium tracking-[-0.01em] text-cobalt">{t("welcome.how")}</Link>
          </div>
          <div className="relative h-[220px] overflow-hidden rounded-[24px] bg-canvas sm:h-[300px] lg:hidden" aria-hidden>
            <Image src="/assets/s01/lung-artwork.png" alt="" fill sizes="(max-width: 1024px) 100vw, 1px" className="object-cover object-[50%_35%]" />
            <div className="absolute inset-0 bg-cobalt mix-blend-color" />
          </div>
          <ul className="flex flex-wrap gap-2 lg:gap-[10px]">
            {tags.map(([key, icon]) => (
              <li key={key} className="flex items-center gap-2 rounded-full bg-surface-soft py-[9px] pl-3 pr-4 text-[13px] tracking-[-0.01em] lg:py-[11px] lg:pl-[14px] lg:pr-[18px] lg:text-[15px]">
                <Image src={`/assets/s01/${icon}`} alt="" width={16} height={16} />
                {t(`welcome.tags.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden h-full lg:block"><WelcomeVisual /></div>
      </div>
      <p className="px-2 text-[11px] leading-[1.45] text-ink-muted sm:px-0">{t("common.footer")}</p>
    </div>
  );
}
