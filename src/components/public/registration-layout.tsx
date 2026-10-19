import { ShieldCheck } from "lucide-react";
import { Step } from "@/components/ui/step";
import { Title } from "@/components/ui/title";
import { getT } from "@/lib/i18n/server";

export async function RegistrationLayout({ current, children }: { current: 1 | 2 | 3; children: React.ReactNode }) {
  const { t } = await getT();
  const steps = [t("signup.steps.account"), t("signup.steps.professional"), t("signup.steps.terms")];
  return (
    <div className="flex items-start gap-[70px] px-[100px] py-8">
      <aside className="flex w-[390px] shrink-0 flex-col gap-6 pt-10">
        <ShieldCheck size={44} strokeWidth={1} className="text-cobalt" aria-hidden />
        <Title as="h1" size={40}>{t("signup.intro.title")}</Title>
        <p className="text-[16px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("signup.intro.body")}</p>
        <ol className="flex flex-col gap-[14px]">
          {steps.map((label, i) => (
            <Step key={label} index={i + 1} label={label} state={i + 1 === current ? "current" : i + 1 < current ? "done" : "default"} />
          ))}
        </ol>
        <p className="text-[12px] leading-[1.45] text-ink-muted">{t("signup.intro.saved")}</p>
      </aside>
      <div className="w-[600px] shrink-0">{children}</div>
    </div>
  );
}
