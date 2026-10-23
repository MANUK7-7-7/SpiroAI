import { BadgeCheck, Upload } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Title } from "@/components/ui/title";
import { getCurrentApplication } from "@/data/repositories/applications";
import { formatSubmitted } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/cn";
import { syncStore } from "@/data/persist";

const order = ["submitted", "in_review", "approved"] as const;
const glyph = ["✓", "◉", "○"];

export default async function VerificationPending() {
  await syncStore();
  const { t, locale } = await getT();
  const app = await getCurrentApplication();
  const at = locale === "es" ? "a las" : "at";
  const current = order.indexOf(app.status as (typeof order)[number]);
  return (
    <PublicShell>
      <div className="flex flex-col gap-7 px-[200px] py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BadgeCheck size={48} strokeWidth={1} className="text-cobalt" aria-hidden />
          <Title as="h1" size={36}>{t("pending.title")}</Title>
          <p className="text-[14px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("pending.subtitle")}</p>
        </div>
        <Card>
          <CardHeading title={t("pending.card")} description={t("pending.meta", { id: app.id, date: formatSubmitted(app.submittedAt, locale, at) })} />
          <ol className="flex gap-5 text-[14px] leading-[1.45]">
            {order.map((s, i) => (
              <li key={s} aria-current={i === current ? "step" : undefined} className={cn("flex min-w-0 flex-1 items-start gap-[10px] rounded-[16px] p-4", i === current ? "bg-cobalt-tint" : "bg-surface-soft")}>
                <span className="text-cobalt" aria-hidden>{i < current ? glyph[0] : i === current ? glyph[1] : glyph[2]}</span>
                <span className="min-w-0 flex-1 font-medium tracking-[-0.01em] text-ink">{t(`pending.tracker.${i}`)}</span>
              </li>
            ))}
          </ol>
          <p className="text-[14px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{app.fullName} · {app.licenseNumber} · {app.institution}</p>
          <div className="flex items-center gap-4 rounded-[16px] border border-dashed border-line p-5">
            <Upload size={20} strokeWidth={1.8} aria-hidden />
            <div className="min-w-0 flex-1 leading-[1.45]">
              <p className="text-[13px] font-medium tracking-[-0.01em] text-ink">{t("pending.upload.title")}</p>
              <p className="text-[12px] text-ink-muted">{t("pending.upload.body")}</p>
            </div>
            <Button size="sm">{t("pending.upload.button")}</Button>
          </div>
          <p className="text-[12px] leading-[1.45] text-ink-muted">{t("pending.notify")}</p>
        </Card>
        <Card>
          <CardHeading title={t("pending.explore.title")} description={t("pending.explore.subtitle")} />
          <div className="flex items-center gap-5">
            <div className="min-w-0 flex-1 leading-[1.45]">
              <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">{t("pending.explore.profile")}</p>
              <p className="text-[12px] text-ink-muted">{t("pending.explore.profileBody")}</p>
            </div>
            <RiskBadge band="low" label={t("pending.explore.badge")} />
          </div>
          <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45]">
            <div className="flex flex-wrap gap-5 text-ink-muted"><p>{t("pending.explore.confidence")}</p><p>{t("pending.explore.quality")}</p></div>
            <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
            <p className="text-ink-muted">{t("pending.explore.final")}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" href="/dashboard">{t("pending.explore.cta")}</Button>
            <Button>{t("pending.explore.support")}</Button>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}
