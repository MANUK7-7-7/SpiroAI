import Link from "next/link";
import { TriangleAlert, Info } from "lucide-react";
import { EmptyPanel } from "@/components/app/data-state";
import { PageHeading } from "@/components/app/page-heading";
import { Composer } from "@/components/messages/composer";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { DEMO_NOW } from "@/config/demo";
import { DemoError, parseDemoState, simulateLatency } from "@/data/demo-state";
import { getPatient } from "@/data/repositories/patients";
import { conversationIdFor, listConversations, messagesFor } from "@/data/repositories/messages";
import { cn } from "@/lib/cn";
import { formatDateTime, formatLongDate, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

type SP = Record<string, string | string[] | undefined>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v);

/** Mon–Fri 08:00–18:00 in the clinic time zone. */
function outsideHours(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return day === "Sat" || day === "Sun" || hour < 8 || hour >= 18;
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const demo = parseDemoState(sp.state);
  await simulateLatency(200);
  if (demo === "error") throw new DemoError();
  const convs = demo === "empty" ? [] : listConversations();
  const wanted = one(sp.patient);
  const patient = wanted ? await getPatient(wanted) : undefined;
  const activeId = patient ? conversationIdFor(patient.id) : convs[0]?.id;
  const active = convs.find((c) => c.id === activeId);
  const subject = patient ?? (active ? await getPatient(active.patientId) : undefined);
  const msgs = subject ? messagesFor(conversationIdFor(subject.id)) : [];
  const unreadConvs = convs.filter((c) => c.unread > 0).length;
  const r = subject?.latest;
  const lastMine = [...msgs].reverse().find((m) => m.from === "clinician");
  const after = outsideHours(DEMO_NOW) || one(sp.state) === "afterhours";
  const q = (one(sp.q) ?? "").toLowerCase();
  const list = convs.filter((c) => !q || c.patientName.toLowerCase().includes(q));
  const first = subject?.name.split(" ")[0] ?? "";
  const locked = subject?.consent === "revoked";

  return (
    <>
      <PageHeading eyebrow={t("messages.eyebrow", { n: unreadConvs })} title={t("messages.title")} />
      <div className="flex items-start gap-3 rounded-card bg-cobalt-tint p-5">
        <TriangleAlert size={20} strokeWidth={1.8} className="mt-0.5 text-cobalt" aria-hidden />
        <div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("messages.emergTitle")}</p><p className="text-[12px] text-ink-muted">{t("messages.emergBody")}</p></div>
      </div>
      {convs.length === 0 ? (
        <EmptyPanel message={t("messages.empty")} action={t("messages.emptyAction")} href="/patients" />
      ) : (
        <div className="flex items-start gap-5">
          <div className="flex w-[310px] shrink-0 flex-col gap-4 rounded-panel bg-surface p-4">
            <form className="flex flex-col gap-[7px]" role="search">
              <label htmlFor="conv-search" className="text-[12px] font-medium">{t("messages.search")}</label>
              <input id="conv-search" name="q" defaultValue={q} placeholder={t("messages.searchPh")} className="min-h-[46px] rounded-input bg-surface-soft p-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1px_var(--cobalt)]" />
            </form>
            <ul className="flex flex-col gap-2">
              {list.map((c) => {
                const last = messagesFor(c.id).at(-1);
                const on = c.id === activeId;
                return (
                  <li key={c.id}>
                    <Link href={`/messages?patient=${c.patientId}`} aria-current={on ? "true" : undefined} className={cn("flex items-start gap-3 rounded-[20px] p-4", on ? "bg-cobalt-tint" : "hover:bg-surface-soft")}>
                      <Avatar initials={c.patientName.split(" ").map((x) => x[0]).slice(0, 2).join("")} className="size-9" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
                        <div className="flex items-center justify-between"><span className="text-[14px] font-medium tracking-[-0.01em]">{c.patientName}</span>{c.unread > 0 && <span className="text-[12px] text-cobalt" aria-label={`${c.unread}`}>{c.unread}</span>}</div>
                        <p className="truncate text-[12px] text-ink-muted">{last?.text.split("\n")[0]}</p>
                        <p className="text-[11px] text-ink-muted">{last ? `${t("dashboard.today")} · ${formatTime(last.at, locale)}` : ""}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <section className="flex min-w-0 flex-1 flex-col gap-5 rounded-panel bg-surface p-6" aria-label={subject?.name}>
            {!subject ? <p className="text-[13px] text-ink-muted">{t("messages.choose")}</p> : (
              <>
                <div className="flex items-center gap-3">
                  <Avatar initials={subject.initials} className="size-9" />
                  <div className="min-w-0 flex-1 leading-[1.45]"><p className="font-display text-[20px] font-medium tracking-[-0.025em]">{subject.name}</p><p className="text-[12px] text-ink-muted">{t("messages.secure", { code: subject.code })}</p></div>
                  <Button size="sm" radius="lg" href={`/patients/${subject.id}`}>{t("messages.openProfile")}</Button>
                </div>
                {r && (
                  <div className="flex flex-col gap-4 rounded-panel bg-cobalt-tint p-6">
                    <p className="text-[22px] font-medium tracking-[-0.02em]">{t("messages.relatedTest", { when: formatDateTime(r.at, locale).replace(" · ", ", ") })}</p>
                    <div className="flex items-center gap-4">
                      <RiskBadge band={r.band} label={`${r.riskIndex} · ${t(`risk.${r.band}`)}`} />
                      <div className="min-w-0 flex-1 text-[11px] leading-[1.45] text-ink-muted"><p>{t("messages.relatedMeta", { conf: Math.round(r.confidence * 100), quality: t(`quality.${r.quality}`), j: t(`judgment.${r.judgment}`) })}</p><p>{t("common.disclaimer")}</p></div>
                      <Button size="sm" radius="lg" href={`/results/${r.resultId}`}>{t("messages.openResult")}</Button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] uppercase tracking-[0.02em] text-ink-muted">{t("dashboard.today").toUpperCase()} · {formatLongDate(DEMO_NOW, locale).split(",").slice(-1)[0].trim().toUpperCase()}</p>
                <div className="flex flex-col gap-4">
                  {msgs.length === 0 && <p className="text-[13px] text-ink-muted">{t("messages.noMessages")}</p>}
                  {msgs.map((m) => (
                    <div key={m.id} className={cn("flex max-w-[620px] flex-col gap-2 rounded-panel p-5 leading-[1.45]", m.from === "clinician" ? "bg-cobalt-tint" : "bg-surface-soft")}>
                      <p className="whitespace-pre-line text-[14px]">{m.text}</p>
                      <p className="text-[10px] text-ink-muted">{m.from === "clinician" ? "Dr. Elena Morales" : subject.name} · {formatTime(m.at, locale)}{m.from === "clinician" ? ` · ${m.delivery === "read" ? "Read ✓✓" : "Delivered ✓"}` : ""}</p>
                    </div>
                  ))}
                </div>
                {locked && <Alert state="error" title={t("messages.locked")}>{t("messages.lockedBody")}</Alert>}
                <Composer patientId={subject.id} first={first} locked={!!locked} lastDelivery={lastMine?.delivery === "read" ? "read" : lastMine ? "delivered" : undefined} resultAttach={r ? `${t("messages.relatedTest", { when: formatDateTime(r.at, locale).replace(" · ", ", ") })}: ${r.riskIndex} · ${t(`risk.${r.band}`)}` : undefined} />
                {after && (
                  <div className="flex items-start gap-3 rounded-[16px] bg-cobalt-tint p-4"><Info size={20} strokeWidth={1.8} className="mt-0.5 text-cobalt" aria-hidden /><div className="leading-[1.45]"><p className="text-[14px] font-medium text-cobalt">{t("messages.afterHoursTitle")}</p><p className="text-[12px] text-ink-muted">{t("messages.afterHoursBody")}</p></div></div>
                )}
              </>
            )}
          </section>
        </div>
      )}
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
