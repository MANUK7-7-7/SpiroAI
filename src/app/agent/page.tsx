import Link from "next/link";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import { PriorityBadge } from "@/components/triage/priority-badge";
import { TryPrototypeButton } from "@/components/auth/try-prototype-button";
import { AGENT, AGENT_VISITS } from "@/data/fixtures/agent";
import { listTriages, type TriageView } from "@/data/repositories/triage";
import { formatDayYear } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export const dynamic = "force-dynamic";

/** Today's home visits: start a triage at each home; finished triages go to the doctor at the centre. */
export default async function AgentHome() {
  await syncStore();
  const { t, locale } = await getT();
  const mine = (await listTriages()).filter((x) => x.homeVisit && x.by === AGENT.name);
  const doneFor = (name: string) => mine.find((x) => x.patientName === name);
  const next = (x: TriageView) =>
    x.referral ? t("triage.status.booked", { date: formatDayYear(x.referral.at, locale) })
      : x.retriageOn ? t("triage.status.retriage", { date: formatDayYear(`${x.retriageOn}T12:00:00-03:00`, locale) })
        : t("triage.status.open");
  const pending = AGENT_VISITS.filter((v) => !doneFor(v.name));

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-medium tracking-[0.06em] text-ink-muted">{t("agent.eyebrow", { name: AGENT.name, centre: AGENT.centre }).toUpperCase()}</p>
        <h1 className="font-display text-[32px] font-medium leading-[1.05] tracking-[-0.04em]">{t("agent.title")}<span className="text-cobalt">.</span></h1>
        <p className="text-[14px] leading-[1.45] text-ink-muted">{t("agent.intro", { doctor: AGENT.doctor })}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="todo">
        <h2 id="todo" className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("agent.toVisit", { n: pending.length })}</h2>
        {pending.length === 0 && <p className="rounded-[20px] bg-surface p-5 text-[14px] text-ink-muted">{t("agent.allDone")}</p>}
        {pending.map((v) => (
          <Link key={v.id} href={`/agent/triage/new?visit=${v.id}`} className="flex items-center gap-3 rounded-[22px] bg-surface p-5 transition-colors hover:bg-surface-soft">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[17px] font-medium tracking-[-0.01em]">{v.name}, {v.age}</p>
                <span className="rounded-full bg-cobalt-tint px-2.5 py-1 text-[12px] font-medium text-cobalt">{t(`agent.reason.${v.reason}`)}</span>
              </div>
              <p className="flex items-center gap-1.5 text-[13px] text-ink-muted"><MapPin size={14} aria-hidden />{v.address}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-ink-muted" aria-hidden />
          </Link>
        ))}
        <Link href="/agent/triage/new" className="flex h-[52px] items-center justify-center gap-2 rounded-input bg-cobalt text-[15px] font-medium text-on-accent hover:bg-cobalt-deep">
          <Plus size={18} aria-hidden />{t("agent.newTriage")}
        </Link>
      </section>

      {mine.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="done">
          <h2 id="done" className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("agent.done", { n: mine.length })}</h2>
          {mine.map((x) => (
            <Link key={x.id} href={`/agent/triage/${x.id}`} className="flex items-center gap-3 rounded-[22px] bg-surface p-5 transition-colors hover:bg-surface-soft">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[16px] font-medium tracking-[-0.01em]">{x.patientName}</p>
                  {x.voiceState === "processing"
                    ? <span className="text-[12px] text-cobalt">{t("triage.voice.processing")}</span>
                    : <PriorityBadge priority={x.priority} label={t(`triage.priority.${x.priority}`)} />}
                </div>
                <p className="text-[13px] text-ink-muted">{next(x)} · {t("agent.sentTo", { doctor: AGENT.doctor })}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-muted" aria-hidden />
            </Link>
          ))}
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 rounded-[22px] bg-surface-soft p-5">
        <p className="text-[13px] leading-[1.45] text-ink-muted">{t("agent.doctorViewHint", { doctor: AGENT.doctor })}</p>
        <TryPrototypeButton role="doctor" next="/alerts" variant="secondary" label={t("agent.doctorView")} className="w-full" />
      </div>
    </>
  );
}
