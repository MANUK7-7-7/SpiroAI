import Image from "next/image";
import { Pin } from "@/components/ui/pin";
import { RiskBadge } from "@/components/ui/risk-badge";
import { getT } from "@/lib/i18n/server";

function CircleButton({ children }: { children: React.ReactNode }) {
  return <div className="flex size-14 items-center justify-center rounded-full bg-surface-soft text-[14px] font-medium tracking-[0.02em]">{children}</div>;
}

/** S01 notched image panel: top-left corner cut out with inverse 36px fillets. */
export async function WelcomeVisual() {
  const { t } = await getT();
  return (
    <div className="relative h-full w-[724px] shrink-0 overflow-hidden rounded-panel bg-canvas">
      <div className="absolute left-[-60px] top-[150px] h-[700px] w-[1060px]">
        <Image src="/assets/s01/lung-artwork.png" alt="" fill className="object-contain" priority />
      </div>
      <div className="absolute inset-0 bg-cobalt mix-blend-color" />

      <div className="absolute left-0 top-0 flex flex-col gap-[10px] rounded-br-[36px] bg-surface pb-[18px] pr-[18px]">
        <CircleButton>ES</CircleButton>
        <CircleButton><Image src="/assets/s01/mic.svg" alt="" width={20} height={20} /></CircleButton>
        <CircleButton><Image src="/assets/s01/user.svg" alt="" width={20} height={20} /></CircleButton>
      </div>
      <Image src="/assets/s01/notch-fillet.svg" alt="" width={36} height={36} className="absolute left-[74px] top-0" />
      <Image src="/assets/s01/notch-fillet.svg" alt="" width={36} height={36} className="absolute left-0 top-[206px]" />

      <Pin label={t("welcome.pins.biomarkers")} className="left-[440px] top-[190px]" />
      <Pin label={t("welcome.pins.baseline")} className="left-[120px] top-[430px]" />
      <Pin label={t("welcome.pins.followup")} side="left" className="left-[445px] top-[600px]" />

      <div className="absolute bottom-5 right-5 flex w-[318px] flex-col gap-[14px] rounded-card bg-surface px-[22px] pb-[18px] pt-5">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-medium tracking-[-0.02em]">{t("welcome.trend.title")}</span>
          <RiskBadge band="low" label={t("risk.low")} />
        </div>
        <Image src="/assets/s01/area-chart.svg" alt="" width={274} height={76} />
        <div className="flex items-center gap-[18px] text-[12px] text-ink-muted">
          <span className="flex items-center gap-[6px]"><Image src="/assets/s01/ellipse.svg" alt="" width={7} height={7} />{t("welcome.trend.baseline")}</span>
          <span className="flex items-center gap-[6px]"><Image src="/assets/s01/accent-dot.svg" alt="" width={7} height={7} />{t("welcome.trend.today")}</span>
        </div>
        <p className="text-[11px] text-ink-muted">{t("welcome.trend.note")}</p>
      </div>
      <p className="absolute bottom-[28px] left-[28px] text-[12px] font-medium uppercase tracking-[0.04em] text-ink">{t("welcome.extra")}</p>
    </div>
  );
}
