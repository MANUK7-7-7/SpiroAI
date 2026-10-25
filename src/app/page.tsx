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

export default async function Welcome() {
  await syncStore();
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-[18px] rounded-shell bg-canvas px-8 pb-7 pt-8">
      <div className="flex h-[940px] gap-6 overflow-hidden rounded-shell bg-surface py-5 pl-14 pr-5">
        <div className="flex h-full min-w-px flex-1 flex-col justify-between pb-9 pt-6">
          <Brand />
          <div className="flex flex-col items-start gap-7">
            <p className="text-[12px] font-medium tracking-[0.06em] text-cobalt">{t("welcome.eyebrow")}</p>
            <h1 className="w-[610px] font-display text-[72px] font-medium leading-[0.98] tracking-[-0.05em] text-ink">
              {t("welcome.headline")}
              <span className="text-cobalt">.</span>
            </h1>
            <p className="w-[470px] text-[18px] leading-[1.4] tracking-[-0.005em] text-ink-muted">{t("welcome.body")}</p>
            <div className="flex flex-wrap gap-3">
              <TryPrototypeButton />
              <Button href="/signup/account">{t("welcome.create")}</Button>
              <Button href="/login">{t("welcome.login")}</Button>
            </div>
            <Link href="/how-it-works" className="text-[14px] font-medium tracking-[-0.01em] text-cobalt">{t("welcome.how")}</Link>
          </div>
          <ul className="flex flex-wrap gap-[10px]">
            {tags.map(([key, icon]) => (
              <li key={key} className="flex items-center gap-2 rounded-full bg-surface-soft py-[11px] pl-[14px] pr-[18px] text-[15px] tracking-[-0.01em]">
                <Image src={`/assets/s01/${icon}`} alt="" width={16} height={16} />
                {t(`welcome.tags.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <WelcomeVisual />
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.footer")}</p>
    </div>
  );
}
