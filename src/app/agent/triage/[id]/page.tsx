import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { PriorityBadge } from "@/components/triage/priority-badge";
import { AppointmentShare, BookingPanel, VoicePoll } from "@/components/triage/triage-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { puma } from "@/config/triage";
import { AGENT } from "@/data/fixtures/agent";
import { getPatient } from "@/data/repositories/patients";
import { getTriage, openSlots } from "@/data/repositories/triage";
import { formatDayYear, formatLongDate, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export const dynamic = "force-dynamic";

/** The agent's result: the priority for a breathing test, the booking, and the confirmation that the doctor has it. */
export default async function AgentTriageResult({ params }: { params: Promise<{ id: string }> }) {
  await syncStore();
  const { t, locale } = await getT();
  const x = getTriage((await params).id);
  if (!x || !x.homeVisit) notFound();
  const patient = await getPatient(x.patientId);
  const processing = x.voiceState === "processing";
  const when = (iso: string) => `${formatLongDate(iso, locale)}, ${formatTime(iso, locale)}`;
  const slots = openSlots().slice(0, 8).map((s) => ({ id: s.id, label: `${formatDayYear(s.at, locale)} · ${formatTime(s.at, locale)}` }));

  return (
    <>
      {processing && <VoicePoll id={x.id} />}
      <div className="leading-[1.3]">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{x.patientName} · {x.code}</p>
        <h1 className="font-display text-[26px] font-medium tracking-[-0.03em]">{t("triage.resultTitle")}</h1>
      </div>

      <section className="flex flex-col gap-4 rounded-[28px] bg-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <PriorityBadge priority={x.priority} label={t(`triage.priority.${x.priority}`)} large />
          {processing && <p role="status" className="text-[13px] text-cobalt">{t("triage.analysing")}</p>}
        </div>
        <dl className="flex flex-col divide-y divide-line text-[14px]">
          <div className="flex flex-col gap-0.5 py-3">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">PUMA</dt><dd className="font-medium">{t("triage.pumaScore", { n: x.pumaScore, max: puma.max })}</dd></div>
            <p className="text-[12px] text-ink-muted">{t("triage.pumaCut", { cut: puma.cutoff })}</p>
          </div>
          <div className="flex flex-col gap-0.5 pt-3">
            <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("triage.voiceSignal")}</dt><dd className="font-medium">{t(`triage.voice.${x.voiceState}`)}</dd></div>
            <p className="text-[12px] text-ink-muted">{x.voiceState === "off" ? t("triage.voiceOff") : t("triage.voiceDemo")}</p>
          </div>
        </dl>
        <Alert state="info" title={t("triage.notDiagnosis")} />
      </section>

      <p className="flex items-start gap-2 rounded-[18px] bg-cobalt-tint p-4 text-[14px] leading-[1.45] text-cobalt">
        <CircleCheck size={18} className="mt-0.5 shrink-0" aria-hidden />{t("agent.sentNotice", { doctor: AGENT.doctor })}
      </p>

      {!x.referral && !x.retriageOn && !processing && (
        <section className="flex flex-col gap-4 rounded-[28px] bg-surface p-5">
          <p className="text-[15px] font-medium">{t(`triage.next.${x.priority}`)}</p>
          <BookingPanel id={x.id} priority={x.priority} slots={slots} canRetriage={x.priority !== "high"} />
        </section>
      )}
      {x.retriageOn && !x.referral && <Alert state="success" title={t("triage.retriageSet", { date: formatDayYear(`${x.retriageOn}T12:00:00-03:00`, locale) })} />}
      {x.referral && (
        <section className="flex flex-col gap-3 rounded-[28px] bg-surface p-5">
          <p className="text-[16px] font-medium text-cobalt">{t("triage.booked")}</p>
          <p className="text-[14px]">{t("triage.bookedAt", { date: when(x.referral.at), place: x.referral.place })}</p>
          {x.override && <p className="text-[12px] text-ink-muted">{t("triage.override")}</p>}
          <AppointmentShare patientId={x.patientId} hasPhone={!!patient?.phone} slipHref={`/slip/${x.id}`} text={t("triage.waText", { first: x.patientName.split(" ")[0], date: when(x.referral.at), place: x.referral.place })} />
        </section>
      )}

      <Button href="/agent" className="w-full">{t("agent.nextVisit")}</Button>
    </>
  );
}
