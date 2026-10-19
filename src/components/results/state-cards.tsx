import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { RiskBand } from "@/config/risk-bands";
import { cn } from "@/lib/cn";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function Banner({ tone, icon, children }: { tone: "info" | "alert"; icon: "check" | "alert" | "info"; children: React.ReactNode }) {
  const Icon = icon === "check" ? CircleCheck : icon === "alert" ? TriangleAlert : Info;
  return (
    <div className={cn("flex items-center gap-3 rounded-[16px] p-4 text-[14px] font-medium leading-[1.45] tracking-[-0.01em]", tone === "alert" ? "bg-cobalt-tint text-cobalt" : "bg-cobalt-tint text-cobalt")}>
      <Icon size={20} strokeWidth={1.6} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

const small = "text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted";

/** Analysis in progress: the result has been received but no score exists yet. */
export function InProgressCard({ t, returnHref }: { t: T; returnHref: string }) {
  return (
    <Card className="rounded-panel" aria-busy>
      <CardHeading title={t("result.inProgressTitle")} />
      <div className="h-[60px] w-[140px] animate-pulse rounded-[18px] bg-surface-sunken" aria-hidden />
      <p className="text-[13px] leading-[1.45]">{t("result.usuallyReady")}</p>
      <div className={small}><p>{t("result.confPending")}</p><p>{t("result.finalNotYet")}</p></div>
      <Banner tone="info" icon="info">{t("common.disclaimer")}</Banner>
      <div><Button href={returnHref}>{t("result.returnQueue")}</Button></div>
    </Card>
  );
}

/** Repeat recommended: never shows a score. The reason is sent to the patient only when the clinician confirms. */
export function RepeatCard({ t, confidence, quality, noise, seconds, reason, action }: { t: T; confidence: number; quality: string; noise: number; seconds: number; reason: string; action: React.ReactNode }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("result.repeatTitle")} />
      <p className="font-display text-[60px] font-medium leading-[1.2] tracking-[-0.05em] text-ink-muted">— / 100</p>
      <div className={cn(small, "flex flex-col gap-2")}>
        <p>{t("result.confLine", { n: Math.round(confidence * 100) })}</p>
        <p>{t("result.qualityPoor", { q: quality, db: noise, sec: seconds })}</p>
      </div>
      <p className="text-[12px] font-medium text-cobalt">{t("common.disclaimer")}</p>
      <p className={small}>{t("result.finalUnreliable")}</p>
      <div className="flex items-start gap-3 rounded-[16px] bg-cobalt-tint p-4">
        <TriangleAlert size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-cobalt" aria-hidden />
        <div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("result.doNotInterpret")}</p><p className="text-[12px] text-ink-muted">{t("result.insufficient")}</p></div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <p className="text-[12px] font-medium">{t("result.reasonLabel")}</p>
        <p className="min-h-[88px] rounded-input bg-surface-soft p-[13px] text-[14px] leading-[1.45] shadow-[inset_0_0_0_1px_var(--line)]">{reason}</p>
      </div>
      <div>{action}</div>
    </Card>
  );
}

export function LowConfidenceCard({ t, band, riskIndex, confidence, quality, noise, seconds, action }: { t: T; band: RiskBand; riskIndex: number; confidence: number; quality: string; noise: number; seconds: number; action: React.ReactNode }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("result.lowConfTitle")} />
      <div><RiskBadge band={band} label={`${riskIndex} · ${t(`risk.${band}`)}`} /></div>
      <p className={small}>{t("result.confLow", { n: Math.round(confidence * 100) })}</p>
      <p className={small}>{t("result.qualityLine", { q: quality, db: noise, sec: seconds })}</p>
      <p className="text-[12px] font-medium text-cobalt">{t("common.disclaimer")}</p>
      <p className={small}>{t("result.finalAwaiting")}</p>
      <div className="flex items-start gap-3 rounded-[16px] bg-cobalt-tint p-4">
        <TriangleAlert size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-cobalt" aria-hidden />
        <div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("result.caution")}</p><p className="text-[12px] text-ink-muted">{t("result.cautionBody")}</p></div>
      </div>
      <div>{action}</div>
    </Card>
  );
}

export function OutcomeCard({ t, kind, action }: { t: T; kind: "no_concern" | "unreliable" | "concerning"; action: React.ReactNode }) {
  const title = { no_concern: "noConcernTitle", unreliable: "unreliableTitle", concerning: "concerningTitle" }[kind];
  const banner = { no_concern: "noConcernBanner", unreliable: "unreliableBanner", concerning: "concerningBanner" }[kind];
  return (
    <Card className="rounded-panel">
      <CardHeading title={t(`result.${title}`)} />
      <Banner tone="info" icon={kind === "concerning" ? "alert" : "check"}>{t(`result.${banner}`)}</Banner>
      <p className={small}>{t("result.trail")}</p>
      <div>{action}</div>
    </Card>
  );
}
export { CircleAlert };
