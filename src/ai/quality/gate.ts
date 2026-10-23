import { AUDIO_TASKS, type AudioTaskId, type DeviceMeta, type RecordingSource } from "../contracts";

/** Measurements taken in the browser or app before upload. */
export type RecordingMeasurement = {
  task: AudioTaskId;
  durationSec: number;
  /** Estimated noise floor in dBFS (more negative is quieter). */
  noiseFloorDb: number;
  peakDb: number;
  /** Fraction of samples at or above full scale. */
  clippedRatio: number;
  /** Fraction of the take that contains voice (for the cough: sound above the noise floor). */
  voicedRatio: number;
};

export type GateThresholds = {
  minDurationSec: Record<AudioTaskId, number>;
  maxNoiseFloorDb: number;
  maxClippedRatio: number;
  /** Per task: a cough is short bursts with silence between them, so it needs far less sound than a vowel. */
  minVoicedRatio: Record<AudioTaskId, number>;
  minSampleRate: number;
};

/**
 * Sample thresholds, UNVALIDATED. They can differ per source because computer microphones and
 * phones behave differently; tune them from the device metadata stored on every result.
 */
export const defaultThresholds: Record<RecordingSource, GateThresholds> = {
  mobile_app: { minDurationSec: { sustained_vowel: 5, counting: 6, cough: 2 }, maxNoiseFloorDb: -45, maxClippedRatio: 0.005, minVoicedRatio: { sustained_vowel: 0.5, counting: 0.4, cough: 0.05 }, minSampleRate: 16000 },
  web_patient: { minDurationSec: { sustained_vowel: 5, counting: 6, cough: 2 }, maxNoiseFloorDb: -42, maxClippedRatio: 0.005, minVoicedRatio: { sustained_vowel: 0.5, counting: 0.4, cough: 0.05 }, minSampleRate: 22050 },
  web_assisted: { minDurationSec: { sustained_vowel: 5, counting: 6, cough: 2 }, maxNoiseFloorDb: -40, maxClippedRatio: 0.005, minVoicedRatio: { sustained_vowel: 0.5, counting: 0.4, cough: 0.05 }, minSampleRate: 22050 },
};

export type GateReason = "TOO_SHORT" | "TOO_NOISY" | "CLIPPING" | "WRONG_TASK" | "LOW_SAMPLE_RATE" | "MISSING_TASK";
export type GateResult = { pass: boolean; level: "good" | "fair" | "poor"; score: number; reasons: GateReason[]; warnings: string[] };

/**
 * Runs BEFORE inference. A failing recording never reaches the model: it becomes
 * `rejected_quality` and the patient is asked to repeat the test.
 */
export function runQualityGate(source: RecordingSource, device: DeviceMeta, takes: RecordingMeasurement[], thresholds = defaultThresholds[source]): GateResult {
  const reasons = new Set<GateReason>();
  const warnings: string[] = [];

  for (const required of AUDIO_TASKS) {
    if (!takes.some((t) => t.task === required)) reasons.add("MISSING_TASK");
  }
  for (const t of takes) {
    if (t.durationSec < thresholds.minDurationSec[t.task]) reasons.add("TOO_SHORT");
    if (t.noiseFloorDb > thresholds.maxNoiseFloorDb) reasons.add("TOO_NOISY");
    if (t.clippedRatio > thresholds.maxClippedRatio) reasons.add("CLIPPING");
    if (t.voicedRatio < thresholds.minVoicedRatio[t.task]) reasons.add("WRONG_TASK");
  }
  if (device.sampleRate < thresholds.minSampleRate) reasons.add("LOW_SAMPLE_RATE");

  // The browser may force processing on even when we ask for it off. That distorts jitter/shimmer/HNR.
  const forced = Object.entries(device.processing).filter(([, on]) => on).map(([k]) => k);
  if (forced.length) warnings.push(`BROWSER_PROCESSING_ON:${forced.join(",")}`);

  const pass = reasons.size === 0;
  const score = Math.max(0, 1 - reasons.size * 0.25 - warnings.length * 0.15);
  const level = !pass ? "poor" : warnings.length ? "fair" : "good";
  return { pass, level, score: Math.round(score * 100) / 100, reasons: [...reasons], warnings };
}
