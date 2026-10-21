// Deterministic, FICTIONAL result history for each patient with recordings.
import { bandFor } from "@/config/risk-bands";
import type { BaselineSnapshot } from "@/ai/contracts";
import type { ScreeningResult } from "@/ai/result";
import { computeDeviations } from "@/ai/postprocess";
import type { ClinicalReview, Patient, RecordingSummary } from "../schemas";
import { patientsFixture } from "./patients";

export type ResultRecord = { result: ScreeningResult; testCode: string; recording: RecordingSummary; review?: ClinicalReview };
export type PatientHistory = { baseline: BaselineSnapshot; baselineBand: [number, number]; records: ResultRecord[] };

const DAY = 86_400_000;
const rngFor = (seed: string) => {
  let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Metric values move away from the personal baseline as risk rises above it. */
export function featuresAt(risk: number, base: { f0: number; jitter: number; shimmer: number; hnr: number; mpt: number }, noise = 0) {
  const t = Math.min(Math.max((risk - 30) / 42, 0), 1.2);
  return {
    f0Hz: Math.round(base.f0 + t * 6 + noise * 3),
    jitterPct: r2(base.jitter + t * 0.7 + noise * 0.02),
    shimmerPct: r1(base.shimmer + t * 1.9 + noise * 0.1),
    hnrDb: r1(base.hnr - t * 5.9 + noise * 0.2),
    mptSec: r1(base.mpt - t * 5.4 + noise * 0.3),
    mfcc: Array.from({ length: 13 }, (_, i) => r2(Math.sin(i + risk) * 12)),
  };
}

const waveform = (seed: string) => {
  const rnd = rngFor(seed);
  return Array.from({ length: 56 }, () => Math.round(8 + rnd() * 28));
};

type Spec = { at: string; risk: number; conf: number; quality: "good" | "fair" | "poor"; judgment: "pending" | "agreed" | "disagreed"; review?: Omit<ClinicalReview, "id" | "resultId" | "clinicianId" | "clinicianName"> };

const jamesSpecs: Spec[] = [
  { at: "2026-07-31T09:02:00-03:00", risk: 28, conf: 0.92, quality: "good", judgment: "agreed" },
  { at: "2026-08-07T09:04:00-03:00", risk: 29, conf: 0.93, quality: "good", judgment: "agreed" },
  { at: "2026-08-14T08:58:00-03:00", risk: 31, conf: 0.92, quality: "good", judgment: "agreed" },
  { at: "2026-08-21T09:07:00-03:00", risk: 33, conf: 0.91, quality: "good", judgment: "agreed" },
  { at: "2026-08-28T09:00:00-03:00", risk: 30, conf: 0.94, quality: "good", judgment: "agreed" },
  { at: "2026-09-04T09:03:00-03:00", risk: 32, conf: 0.93, quality: "good", judgment: "agreed" },
  { at: "2026-09-11T09:05:00-03:00", risk: 34, conf: 0.92, quality: "good", judgment: "agreed" },
  { at: "2026-09-18T08:59:00-03:00", risk: 31, conf: 0.58, quality: "poor", judgment: "agreed", review: { judgment: "disagree", note: "Noisy recording. Repeat requested.", outcome: "unreliable", shareDeidentifiedFeedback: false, at: "2026-09-18T10:30:00-03:00" } },
  { at: "2026-09-25T09:10:00-03:00", risk: 35, conf: 0.93, quality: "good", judgment: "agreed", review: { judgment: "agree", note: "No concern.", outcome: "no_concern", shareDeidentifiedFeedback: false, at: "2026-09-25T11:00:00-03:00" } },
  { at: "2026-10-02T09:01:00-03:00", risk: 48, conf: 0.89, quality: "good", judgment: "agreed", review: { judgment: "agree", note: "Rising from baseline. Arrange spirometry follow-up.", outcome: "follow_up", shareDeidentifiedFeedback: false, at: "2026-10-02T10:15:00-03:00" } },
  { at: "2026-10-09T09:06:00-03:00", risk: 54, conf: 0.9, quality: "good", judgment: "agreed", review: { judgment: "agree", note: "Exacerbation reported by the patient. Monitoring weekly.", outcome: "follow_up", shareDeidentifiedFeedback: false, at: "2026-10-09T10:20:00-03:00" } },
  { at: "2026-10-16T08:42:00-03:00", risk: 72, conf: 0.92, quality: "good", judgment: "pending" },
];

const jamesBase = { f0: 128, jitter: 0.72, shimmer: 2.9, hnr: 23.1, mpt: 16.8 };
const jamesSd = { f0: 8, jitter: 0.15, shimmer: 0.5, hnr: 1.5, mpt: 1.8 };

function baselineFor(patientId: string, base: typeof jamesBase, sd: typeof jamesSd, riskBase: number, from: string, to: string): BaselineSnapshot {
  void patientId;
  return {
    window: { from, to }, method: "median_first_n", sampleCount: 6, riskIndex: riskBase,
    metrics: { f0: { mean: base.f0, sd: sd.f0 }, jitter: { mean: base.jitter, sd: sd.jitter }, shimmer: { mean: base.shimmer, sd: sd.shimmer }, hnr: { mean: base.hnr, sd: sd.hnr }, mpt: { mean: base.mpt, sd: sd.mpt } },
  };
}

function build(p: Patient, specs: Spec[], base: typeof jamesBase, sd: typeof jamesSd, testBase: number): PatientHistory {
  const riskBase = Math.round(specs.slice(0, 6).reduce((a, s) => a + s.risk, 0) / Math.min(6, specs.length));
  const baseline = baselineFor(p.id, base, sd, riskBase, specs[0].at, specs[Math.min(5, specs.length - 1)].at);
  const rnd = rngFor(p.id);
  const records: ResultRecord[] = specs.map((s, i) => {
    const id = `r-${p.id}-${i + 1}`;
    const f = featuresAt(s.risk, base, (rnd() - 0.5) * 2);
    const poor = s.quality === "poor";
    const result: ScreeningResult = {
      id, patientId: p.id, recordingId: `rec-${p.id}-${i + 1}`, source: "mobile_app", status: "ready", riskIndex: s.risk, band: bandFor(s.risk),
      changeVsBaseline: s.risk - riskBase, confidence: s.conf, quality: { level: s.quality, reasons: poor ? ["TOO_NOISY"] : [] },
      features: f, deviations: computeDeviations(f, baseline), modelId: "mock-demo", modelVersion: "0.0.0-demo", extractorVersion: "mock-extractor-0.0.0",
      isDemoModel: true, latencyMs: 900 + Math.round(rnd() * 600), warnings: ["DEMO_MODEL_NOT_VALIDATED"], createdAt: s.at,
      completedAt: new Date(Date.parse(s.at) + 60_000).toISOString().replace("Z", "+00:00"),
    };
    const review: ClinicalReview | undefined = s.review ? { id: `rv-${id}`, resultId: id, clinicianId: "c-001", clinicianName: "E. Morales", ...s.review } : undefined;
    const recording: RecordingSummary = {
      recordingId: result.recordingId, source: "mobile_app", deviceLabel: "iPhone", microphoneCheck: "passed", vowelSec: 16, countingSec: 10, coughSec: 4,
      noiseDb: poor ? 41 : 18, receivedAt: new Date(Date.parse(s.at) + 60_000).toISOString().replace("Z", "+00:00"), waveform: waveform(id),
    };
    return { result, testCode: `T-${testBase + i}`, recording, review };
  });
  const early = specs.slice(0, 6).map((s) => s.risk);
  const band: [number, number] = p.id === "p-001" ? [28, 38] : [Math.max(0, Math.min(...early) - 2), Math.min(100, Math.max(...early) + 2)];
  return { baseline, baselineBand: band, records };
}

const cache = new Map<string, PatientHistory>();

/** Newest-first records for a patient, or undefined when they have no recording. */
export function historyFor(patientId: string): PatientHistory | undefined {
  if (cache.has(patientId)) return cache.get(patientId);
  const p = patientsFixture.find((x) => x.id === patientId);
  if (!p?.latest) return undefined;
  let h: PatientHistory;
  if (p.id === "p-001") {
    h = build(p, jamesSpecs, jamesBase, jamesSd, 2075);
  } else {
    const rnd = rngFor(p.id);
    const n = 8;
    const end = Date.parse(p.latest.at);
    const startRisk = Math.max(5, p.latest.riskIndex - p.latest.trend * 1.5 - 3);
    const specs: Spec[] = Array.from({ length: n }, (_, i) => {
      const last = i === n - 1;
      const risk = last ? p.latest!.riskIndex : Math.round(startRisk + ((p.latest!.riskIndex - p.latest!.trend - startRisk) * i) / (n - 2) + (rnd() - 0.5) * 6);
      return { at: new Date(end - (n - 1 - i) * 7 * DAY).toISOString().replace("Z", "+00:00"), risk: Math.min(100, Math.max(0, risk)), conf: last ? p.latest!.confidence : r2(0.86 + rnd() * 0.09), quality: last ? p.latest!.quality : "good", judgment: last ? p.latest!.judgment : "agreed" };
    });
    const base = { f0: p.sex === "f" ? 200 : 125, jitter: 0.6, shimmer: 2.6, hnr: 22.5, mpt: 17 };
    h = build(p, specs, base, { f0: 8, jitter: 0.15, shimmer: 0.5, hnr: 1.5, mpt: 1.8 }, 2000 + (parseInt(p.id.replace(/\D/g, ""), 10) % 60) * 10);
  }
  cache.set(patientId, h);
  return h;
}
