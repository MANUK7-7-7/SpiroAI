import type { BaselineSnapshot, DeviceMeta, Features } from "@/ai/contracts";
import type { ScreeningResult } from "@/ai/result";

export const device: DeviceMeta = {
  deviceType: "laptop", os: "macOS", browser: "Chrome", microphoneKind: "built_in", sampleRate: 48000, channelCount: 1,
  processing: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
};

export const features: Features = { f0Hz: 151, jitterPct: 0.52, shimmerPct: 2.9, hnrDb: 21.8, mptSec: 15.5, mfcc: [1, 2, 3] };

export const baseline: BaselineSnapshot = {
  window: { from: "2026-08-01T00:00:00-03:00", to: "2026-09-01T00:00:00-03:00" }, method: "median_first_n", sampleCount: 6, riskIndex: 18,
  metrics: { f0: { mean: 150, sd: 10 }, jitter: { mean: 0.5, sd: 0.1 }, shimmer: { mean: 2.8, sd: 0.4 }, hnr: { mean: 22, sd: 1 }, mpt: { mean: 16, sd: 2 } },
};

export const goodTakes = [
  { task: "sustained_vowel" as const, durationSec: 7, noiseFloorDb: -55, peakDb: -6, clippedRatio: 0, voicedRatio: 0.9 },
  { task: "reading_passage" as const, durationSec: 35, noiseFloorDb: -55, peakDb: -6, clippedRatio: 0, voicedRatio: 0.8 },
];

export const result = (over: Partial<ScreeningResult>): ScreeningResult => ({
  id: "r", patientId: "p", recordingId: "rec", source: "web_patient", status: "ready", riskIndex: 20, band: "low", warnings: [], createdAt: "2026-10-16T08:00:00-03:00", ...over,
});
