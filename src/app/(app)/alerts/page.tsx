import Link from "next/link";
import { AuditTrail, DismissAlert } from "@/components/alerts/dismiss-dialog";
import { EmptyPanel } from "@/components/app/data-state";
import { PageHeading } from "@/components/app/page-heading";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { DEMO_NOW } from "@/config/demo";
import { defaultRiskBands } from "@/config/risk-bands";
import { parseDemoState } from "@/data/demo-state";
import { listAlerts } from "@/data/repositories/alerts";
import { getPatient } from "@/data/repositories/patients";
import type { Alert as AlertT } from "@/data/schemas";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDayYear, relativeDayTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

type SP = Record<string, string | string[] | undefined>;
const groupOf = (s: AlertT["severity"]) => (s === "info" ? "low" : s);
const color = { high: "text-risk-high", moderate: "text-cobalt", low: "text-cobalt" } as const;

export default async function AlertsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const tab = sp.tab === "resolved" ? "resolved" : "open";
  const demo = parseDemoState(sp.state);
  const [open, resolved] = await Promise.all([listAlerts("open", demo), listAlerts("resolved", demo)]);
  const list = tab === "open" ? open : resolved;
  const now = Date.parse(DEMO_NOW);
  const ago = (iso: string) => {
    const mins = Math.max(1, Math.round((now - Date.parse(iso)) / 60000));
    return mins >= 60 && mins < 1440 ? t("alertsCenter.ago.hourMin", { h: Math.floor(mins / 60), m: mins % 60 }) : mins < 60 ? t("alertsCenter.ago.min", { n: mins }) : "";
  };
  const labels = { today: t("alertsCenter.today"), yesterday: t("alertsCenter.yesterday") };

  const card = async (a: AlertT) => {
    const p = await getPatient(a.patientId);
    const r = p?.latest;
    const params = { ...a.params, high: defaultRiskBands.highFrom } as Record<string, string | number>;
    const meta = a.rule === "missed_tests" ? t("alertsCenter.lastResult", { conf: Math.round((r?.confidence ?? 0) * 100), quality: t(`quality.${r?.quality ?? "good"}`), disclaimer: t("common.disclaimer") })
      : a.rule === "poor_quality" ? t("alertsCenter.lastReliable", { conf: Math.round((r?.confidence ?? 0) * 100), quality: t(`quality.${r?.quality ?? "good"}`), disclaimer: t("common.disclaimer") })
      : t("alertsCenter.aiMeta", { conf: Math.round((r?.confidence ?? 0) * 100), quality: t(`quality.${r?.quality ?? "good"}`), j: t(`judgment.${r?.judgment ?? "pending"}`), disclaimer: t("common.disclaimer") });
    return (
      <article key={a.id} className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 leading-[1.45]">
            <h3 className="text-[20px] font-medium tracking-[-0.015em]">{a.patientName} · {p?.code}</h3>
            <p className="text-[15px] font-medium tracking-[-0.01em]">{t(`alertsCenter.titles.${a.rule}`, params)}</p>
            <p className="text-[11px] text-ink-muted">{relativeDayTime(a.firedAt, DEMO_NOW, locale, labels)}{ago(a.firedAt) ? ` · ${ago(a.firedAt)}` : ""} · {t(`alertsCenter.rules.${a.rule}`, params)}</p>
          </div>
          {r && <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} />}
        </div>
        <p className="text-[11px] leading-[1.45] text-ink-muted">{meta}</p>
        <div className="flex flex-wrap gap-[10px]">
          <Button size="sm" radius="lg" href={a.resultId ? `/results/${a.resultId}` : `/patients/${a.patientId}`}>{t("alertsCenter.openResult")}</Button>
          <Button size="sm" variant="primary" radius="lg" href={`?panel=action&patient=${a.patientId}&alert=${a.id}`}>{t("alertsCenter.takeAction")}</Button>
          <Button size="sm" radius="lg" href={`/messages?patient=${a.patientId}`}>{t("alertsCenter.messagePatient")}</Button>
          <DismissAlert alertId={a.id} sub={t("alertsCenter.dismissSub", { name: a.patientName, code: p?.code ?? "", what: t(`alertsCenter.titles.${a.rule}`, params).split(" · ")[0], date: formatDayYear(a.firedAt, locale) })} />
        </div>
      </article>
    );
  };

  const resolvedCard = async (a: AlertT) => {
    const reason = a.state === "dismissed" ? t("alertsCenter.dismissed", { reason: a.dismissedReason ?? "" }) : t("alertsCenter.resolvedReason", { reason: a.resolution ?? "" });
    const params = { ...a.params, high: defaultRiskBands.highFrom } as Record<string, string | number>;
    return (
      <article key={a.id} className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex flex-col gap-1 leading-[1.45]">
          <h3 className="text-[20px] font-medium tracking-[-0.015em]">{a.patientName}</h3>
          <p className="text-[12px] text-ink-muted">{formatDateTime(a.resolvedAt ?? a.firedAt, locale)} · {a.resolvedBy}</p>
        </div>
        <p className="text-[15px] font-medium">{t(`alertsCenter.titles.${a.rule}`, params)}</p>
        <p className="text-[13px] text-ink-muted">{reason}</p>
        <div className="flex gap-[10px]"><span className="inline-flex h-[34px] items-center rounded-full bg-ink px-4 text-[12px] font-medium text-on-accent">{t("alertsCenter.resolvedChip")}</span><AuditTrail alertId={a.id} /></div>
      </article>
    );
  };

  const groups = (["high", "moderate", "low"] as const).map((g) => ({ g, items: open.filter((a) => groupOf(a.severity) === g) })).filter((x) => x.items.length);
  const shownResolved = resolved.slice(0, 20);

  return (
    <>
      <PageHeading eyebrow={t("alertsCenter.eyebrow")} title={t("alertsCenter.title")} action={{ label: t("alertsCenter.settings"), href: "/settings/thresholds", variant: "secondary" }} />
      <nav className="flex gap-2 border-b border-line pb-3" aria-label={t("alertsCenter.title")}>
        {([["open", t("alertsCenter.open", { n: open.length })], ["resolved", t("alertsCenter.resolved", { n: resolved.length })]] as const).map(([k, label]) => (
          <Link key={k} href={k === "open" ? "/alerts" : "/alerts?tab=resolved"} aria-current={tab === k ? "page" : undefined} className={cn("rounded-full px-[15px] py-[10px] text-[13px] font-medium tracking-[-0.01em]", tab === k ? "bg-ink text-on-accent" : "text-ink-muted hover:text-ink")}>{label}</Link>
        ))}
      </nav>
      {tab === "open" ? (
        list.length === 0 ? <EmptyPanel message={t("alertsCenter.empty")} /> : (
          <>
            {await Promise.all(groups.map(async ({ g, items }) => (
              <section key={g} className="flex flex-col gap-4">
                <h2 className={cn("text-[12px] font-medium", color[g])}>{t(`alertsCenter.groups.${g}`, { n: items.length })}</h2>
                {await Promise.all(items.map(card))}
              </section>
            )))}
            <p className="text-[12px] leading-[1.45] text-ink-muted">{t("alertsCenter.footnote")}</p>
          </>
        )
      ) : list.length === 0 ? <EmptyPanel message={t("alertsCenter.emptyResolved")} /> : (
        <>
          <Alert state="success" title={t("alertsCenter.resolvedBanner", { n: resolved.length })}>{t("alertsCenter.resolvedBannerBody")}</Alert>
          {await Promise.all(shownResolved.map(resolvedCard))}
        </>
      )}
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
