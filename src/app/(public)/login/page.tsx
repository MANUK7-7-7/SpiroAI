import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { PublicShell } from "@/components/public/public-shell";
import { Alert } from "@/components/ui/alert";
import { Title } from "@/components/ui/title";
import { getT } from "@/lib/i18n/server";

export default async function LoginPage() {
  const { t } = await getT();
  return (
    <PublicShell>
      <div className="flex h-[820px] items-center gap-24 overflow-hidden rounded-shell bg-surface py-5 pl-5 pr-24">
        <div className="relative flex h-full w-[700px] shrink-0 flex-col justify-end gap-5 overflow-hidden rounded-panel bg-canvas p-11">
          <div className="absolute left-[-120px] top-[-20px] h-[620px] w-[980px]">
            <Image src="/assets/s01/lung-artwork.png" alt="" fill className="object-contain" priority />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[360px]" style={{ backgroundImage: "linear-gradient(to bottom, color-mix(in srgb, var(--canvas) 0%, transparent), color-mix(in srgb, var(--canvas) 92%, transparent) 55%, var(--canvas))" }} />
          <div className="absolute inset-0 bg-cobalt mix-blend-color" />
          <Title as="h2" size={56} className="relative leading-none" >{t("login.title")}</Title>
          <p className="relative text-[17px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("login.intro")}</p>
          <Alert title={t("login.sharedTitle")} className="relative">{t("login.sharedBody")}</Alert>
        </div>
        <LoginForm />
      </div>
    </PublicShell>
  );
}
