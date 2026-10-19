import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/results/audio-player";
import { ReviewPanel } from "@/components/results/review-panel";
import { InProgressCard, LowConfidenceCard, OutcomeCard, RepeatCard } from "@/components/results/state-cards";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Title } from "@/components/ui/title";
import { defaultRiskBands } from "@/config/risk-bands";
import { LOW_CONFIDENCE } from "@/config/review";
import { metricCatalog, metricOrder } from "@/config/metrics";
import { parseDemoState } from "@/data/demo-state";
import { getRecord, reviewLabelKey } from "@/data/repositories/results";
import { historyFor } from "@/data/fixtures/history";
import { formatDateTime, formatDay, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { signPath } from "@/lib/signed-url";
import { cn } from "@/lib/cn";
import type { MetricId } from "@/ai/contracts";

const fmt = (m: MetricId, v: number) => `${v.toFixed(metricCatalog[m].decimals)}${metricCatalog[m].unit === "%" ? "%" : ` ${metricCatalog[m].unit}`}`;
const range = (m: MetricId) => { const c = metricCatalog[m]; const d = (n: number) => String(Number(n.toFixed(1))); return `${d(c.example.min)}–${d(c.example.max)}${c.unit === "%" ? "%" : ` ${c.unit}`}`; };

export default async function ResultPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const { t, locale } = await getT();
  const data = await getRecord(id, parseDemoState((await searchParams).state));
  if (!data) notFound();
  const { record, prevId, nextId, patient } = data;
  const r = record.result;
  const rec = record.recording;
  const label = reviewLabelKey(record);
  const history = historyFor(patient.id);
  const idx = history?.records.findIndex((x) => x.result.id === id) ?? -1;
  const prev = idx > 0 ? history!.records.slice(0, idx).reverse().find((x) => x.result.status === "ready" && x.result.quality?.level !== "poor")?.result : undefined;
  const returnHref = "/dashboard";
  const total = rec.vowelSec + rec.readingSec;
  const quality = t(`quality.${r.quality?.level ?? "good"}`);
  const confidence = r.confidence ?? 0;
  const lowConfidence = r.status === "ready" && confidence < LOW_CONFIDENCE;
  const poor = r.status === "rejected_quality" || r.quality?.level === "poor";
  const review = record.review;
  const bandWord = (b: string) => t(`risk.${b}`);
  const thresholds = { lo: 0, lm: defaultRiskBands.moderateFrom - 1, mo: defaultRiskBands.moderateFrom, mm: defaultRiskBands.highFrom - 1, hi: defaultRiskBands.highFrom };
  const source = rec.source === "mobile_app" ? t("result.ctxPatientApp") : rec.source === "web_patient" ? t("result.ctxPatientWeb") : t("result.ctxAssisted");
  const check = t(`result.check${rec.microphoneCheck === "passed" ? "Passed" : rec.microphoneCheck === "failed" ? "Failed" : "Skipped"}`);
  const reviewedWhen = review ? `${formatDay(review.at, locale)} · ${formatTime(review.at, locale)}` : "";
  const outcome = review ? (review.outcome === "no_concern" ? "no_concern" : review.outcome === "unreliable" || review.outcome === "repeat_requested" ? "unreliable" : "concerning") : undefined;
  const link = (href: string, text: string) => <Button href={href}>{text}</Button>;
  const stateMain = r.status === "processing" || r.status === "pending" ? (
    <InProgressCard t={t} returnHref={returnHref} />
  ) : poor ? (
    <RepeatCard t={t} confidence={confidence} quality={quality} noise={rec.noiseDb} seconds={rec.vowelSec} reason={t("result.reasonDefault")} action={<Button variant="primary" href="?panel=action&type=repeat">{t("result.requestRepeatBtn")}</Button>} />
  ) : undefined;
  const ready = r.status === "ready" && !poor;
  const delta = ready && prev ? r.riskIndex! - prev.riskIndex! : undefined;

  return (
    <>
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{t("result.crumb", { name: patient.name.toUpperCase(), code: patient.code, test: record.testCode.replace("T-", ""), when: formatDateTime(r.createdAt, locale).toUpperCase().replace(" · ", ", ") }).replace("TEST ", "TEST T-")}</p>
          <Title size={30}>{t("result.title")}</Title>
        </div>
        <div className="flex gap-2">
          {prevId ? <Button size="sm" href={`/results/${prevId}`}>{t("result.prev")}</Button> : <Button size="sm" disabled>{t("result.prev")}</Button>}
          {nextId ? <Button size="sm" href={`/results/${nextId}`}>{t("result.next")}</Button> : <Button size="sm" disabled>{t("result.next")}</Button>}
        </div>
      </div>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {stateMain ?? (
            <>
              {lowConfidence && (
                <LowConfidenceCard t={t} band={r.band!} riskIndex={r.riskIndex!} confidence={confidence} quality={quality} noise={rec.noiseDb} seconds={total} action={link(`#listen`, t("result.reviewRecording"))} />
              )}
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <CardHeading title={t("result.indexTitle")} description={t("result.indexSub")} />
                  {r.isDemoModel && <span title={t("result.demoModelNote")} className="shrink-0 rounded-full bg-cobalt-tint px-[10px] py-[5px] text-[11px] font-medium text-cobalt">{t("result.demoModel")}</span>}
                </div>
                <div className="flex items-center gap-6">
                  <p className="whitespace-nowrap font-display text-[60px] font-medium leading-[1.45] tracking-[-0.05em]">{r.riskIndex}</p>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <RiskBadge band={r.band!} label={bandWord(r.band!)} />
                    <p className={cn("text-[13px] leading-[1.45]", r.band === "high" ? "text-risk-high" : "text-ink-muted")}>
                      {delta !== undefined && prev ? t("result.change", { arrow: delta >= 0 ? "↑" : "↓", n: Math.abs(delta), date: formatDay(prev.createdAt, locale), score: prev.riskIndex!, band: bandWord(prev.band!) }) : t("result.noBaseline")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1" role="img" aria-label={t("result.thresholds", thresholds)}>
                  <span className="h-[7px] min-w-px flex-1 rounded-full bg-cobalt-tint-strong" /><span className="h-[7px] min-w-px flex-1 rounded-full bg-cobalt" /><span className="h-[7px] min-w-px flex-1 rounded-full bg-risk-high" />
                </div>
                <div className="flex flex-col gap-[10px] text-[12px] leading-[1.45]">
                  <div className="flex flex-wrap gap-5 text-ink-muted"><p>{t("overview.confidence", { n: Math.round(confidence * 100) })}</p><p>{t("overview.quality", { q: quality })}</p></div>
                  <p className="font-medium text-cobalt">{t("common.disclaimer")}</p>
                  <p className="text-ink-muted">{t("result.finalLine", { j: t(label.key, label.vars) })}</p>
                </div>
                <p className="text-[11px] leading-[1.45] text-ink-muted">{t("result.thresholds", thresholds)}</p>
              </Card>
              <Card>
                <CardHeading title={t("result.metricsTitle")} description={t("result.metricsSub")} />
                <div role="table" aria-label={t("result.metricsTitle")} className="flex flex-col">
                  <div role="row" className="flex gap-3 pb-4 text-[10px] font-medium leading-[1.45] text-ink-muted">
                    {[["metric", "w-[90px]"], ["value", "w-[90px]"], ["range", "w-[130px]"], ["baseline", "w-[130px]"], ["deviation", "w-[90px]"]].map(([c, w]) => <p key={c} role="columnheader" className={w}>{t(`result.cols.${c}`)}</p>)}
                  </div>
                  {r.deviations?.map((d) => {
                    const flagged = d.flag === "deviation";
                    const up = d.baseline !== undefined && d.value > d.baseline;
                    return (
                      <div key={d.metric} role="row" className="flex items-center gap-3 border-b border-line py-5 text-[12px] leading-[1.45]">
                        <p role="cell" className="w-[90px]">{t(`result.metricNames.${d.metric}`)}</p>
                        <p role="cell" className="w-[90px] font-mono">{fmt(d.metric, d.value)}</p>
                        <p role="cell" className="w-[130px]">{range(d.metric)}</p>
                        <p role="cell" className="w-[130px]">{d.baseline !== undefined ? fmt(d.metric, d.baseline) : "—"}</p>
                        <p role="cell" className={cn("w-[90px]", flagged ? "text-risk-moderate" : d.flag === "watch" ? "text-ink-muted" : "text-ink")}>
                          {flagged ? t(up ? "result.flagUp" : "result.flagDown") : d.flag === "watch" ? t("result.watch") : t("result.within")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
          <Card>
            <div id="listen" />
            <CardHeading title={t("result.audioTitle")} description={t("result.audioSub", { quality: quality, db: rec.noiseDb, sec: total })} />
            <AudioPlayer label={t("result.vowel")} recordingId={rec.recordingId} task="sustained_vowel" durationSec={rec.vowelSec} src={signPath(`/api/audio/${rec.recordingId}/sustained_vowel`)} waveform={rec.waveform} />
            <AudioPlayer label={t("result.reading")} recordingId={rec.recordingId} task="reading_passage" durationSec={rec.readingSec} src={signPath(`/api/audio/${rec.recordingId}/reading_passage`)} waveform={[...rec.waveform].reverse()} />
            <p className="text-[11px] text-ink-muted">{t("result.syntheticAudio")}</p>
          </Card>
          {outcome && (
            <OutcomeCard t={t} kind={outcome} action={outcome === "concerning" ? <Button href="?panel=action">{t("result.action")}</Button> : outcome === "unreliable" ? <Button href="?panel=action&type=repeat">{t("result.viewInstructions")}</Button> : <Button href={returnHref}>{t("result.returnQueue")}</Button>} />
          )}
        </div>
        <div className="flex w-[350px] shrink-0 flex-col gap-5">
          <ReviewPanel resultId={r.id} patientId={patient.id} disabled={r.status !== "ready"} reviewed={review ? { who: review.clinicianName, when: reviewedWhen, judgment: review.judgment, note: review.note } : undefined} />
          <Card>
            <CardHeading title={t("result.contextTitle")} />
            <div className="text-[12px] leading-[1.45]">
              <p>{source}</p>
              <p>{t("result.tasks")}</p>
              <p>{t("result.device", { device: rec.deviceLabel, check })}</p>
              <p>{t("result.received", { time: formatTime(rec.receivedAt, locale) })}</p>
              {r.modelId && <p>{t("result.model", { id: r.modelId, version: r.modelVersion ?? "", ext: r.extractorVersion ?? "" })}</p>}
            </div>
            <p className="text-[11px] leading-[1.45] text-ink-muted">{t("result.logged")}</p>
          </Card>
        </div>
      </div>
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("common.sampleNotice")}</p>
    </>
  );
}
