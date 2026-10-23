import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/page-heading";
import { PriorityBadge } from "@/components/triage/priority-badge";
import { AppointmentShare, BookingPanel, StartMonitoring, VoicePoll } from "@/components/triage/triage-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { puma } from "@/config/triage";
import { getPatient } from "@/data/repositories/patients";
import { getTriage, openSlots } from "@/data/repositories/triage";
import { formatDateTime, formatDayYear, formatLongDate, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export const dynamic = "force-dynamic";

export default async function TriageResult({ params }: { params: Promise<{ id: string }> }) {
  await syncStore();
  const { t, locale } = await getT();
  const x = getTriage((await params).id);
  if (!x) notFound();
  const patient = await getPatient(x.patientId);
  const processing = x.voiceState === "processing";
  const when = (iso: string) => `${formatLongDate(iso, locale)}, ${formatTime(iso, locale)}`;
  const slots = openSlots().slice(0, 12).map((s) => ({ id: s.id, label: `${formatDayYear(s.at, locale)} · ${formatTime(s.at, locale)}` }));
  return (
    <>
      {processing && <VoicePoll id={x.id} />}
      <PageHeading eyebrow={`${x.patientName.toUpperCase()} · ${x.code} · ${x.centre.toUpperCase()}`} title={t("triage.resultTitle")} action={{ label: t("triage.nav"), href: "/triage", variant: "secondary" }} />
      <div className="flex items-start gap-5 max-lg:flex-col">
        <Card className="min-w-0 flex-1 gap-5 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <PriorityBadge priority={x.priority} label={t(`triage.priority.${x.priority}`)} large />
            {processing && <p role="status" className="text-[13px] text-cobalt">{t("triage.analysing")}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
            <div className="rounded-[16px] bg-surface-soft p-4"><p className="text-[12px] text-ink-muted">PUMA</p><p className="text-[18px] font-medium">{t("triage.pumaScore", { n: x.pumaScore, max: puma.max })}</p><p className="text-[11px] text-ink-muted">{t("triage.pumaCut", { cut: puma.cutoff })}</p></div>
            <div className="rounded-[16px] bg-surface-soft p-4"><p className="text-[12px] text-ink-muted">{t("triage.voiceSignal")}</p><p className="text-[18px] font-medium">{t(`triage.voice.${x.voiceState}`)}</p><p className="text-[11px] text-ink-muted">{x.voiceState === "off" ? t("triage.voiceOff") : t("triage.voiceDemo")}</p></div>
          </div>
          <Alert state="info" title={t("triage.notDiagnosis")} />
          {!x.referral && !x.retriageOn && !processing && (
            <>
              <p className="text-[15px] font-medium">{t(`triage.next.${x.priority}`)}</p>
              <BookingPanel id={x.id} priority={x.priority} slots={slots} canRetriage={x.priority !== "high"} />
            </>
          )}
          {x.retriageOn && !x.referral && <Alert state="success" title={t("triage.retriageSet", { date: formatDayYear(`${x.retriageOn}T12:00:00-03:00`, locale) })} />}
          {x.referral && (
            <div className="flex flex-col gap-3 rounded-[20px] bg-cobalt-tint p-5">
              <p className="text-[16px] font-medium text-cobalt">{t("triage.booked")}</p>
              <p className="text-[14px]">{t("triage.bookedAt", { date: when(x.referral.at), place: x.referral.place })}</p>
              {x.override && <p className="text-[12px] text-ink-muted">{t("triage.override")}</p>}
              {!x.spirometry && <AppointmentShare patientId={x.patientId} hasPhone={!!patient?.phone} slipHref={`/slip/${x.id}`} text={t("triage.waText", { first: x.patientName.split(" ")[0], date: when(x.referral.at), place: x.referral.place })} />}
            </div>
          )}
          {x.spirometry && (
            <div className="flex flex-col gap-3 rounded-[20px] bg-surface-soft p-5">
              <p className="text-[16px] font-medium">{t("triage.resultBack")}</p>
              <p className="text-[14px]">{x.spirometry.status === "no_show" ? t("triage.status.noShow") : `${x.spirometry.ratio !== undefined ? t("triage.ratio", { r: x.spirometry.ratio }) + " · " : ""}${x.spirometry.obstruction ? t("triage.obstruction") : t("triage.noObstruction")}`}</p>
              <p className="text-[11px] text-ink-muted">{x.spirometry.enteredBy} · {formatDateTime(x.spirometry.enteredAt, locale)}</p>
              {x.spirometry.obstruction && (x.monitoringStarted ? (
                <div className="flex flex-wrap items-center gap-3"><Alert state="success" title={t("triage.monitoringStarted")} /><Button href={`/patients/${x.patientId}`}>{t("triage.openPatient")}</Button></div>
              ) : <div><StartMonitoring id={x.id} /></div>)}
            </div>
          )}
        </Card>
        <Card className="w-[320px] shrink-0 gap-3 p-6 max-lg:w-full">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("triage.questionsTitle")}</p>
          <ul className="flex flex-col gap-2 text-[13px]">
            <li>{t("triage.age")}: {x.answers.age} · {t(x.answers.sex === "m" ? "triage.male" : "triage.female")}</li>
            <li>{t("triage.packYears")}: {x.answers.packYears}</li>
            {(["dyspnea", "phlegm", "cough", "priorSpirometry"] as const).map((k) => <li key={k} className="text-ink-muted">{t(`triage.q.${k}`)} <span className="font-medium text-ink">{x.answers[k] ? t("triage.yes") : t("triage.no")}</span></li>)}
          </ul>
          <p className="text-[11px] text-ink-muted">{x.by} · {formatDateTime(x.at, locale)}</p>
        </Card>
      </div>
    </>
  );
}
