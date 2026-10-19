import type { MetricId } from "@/ai/contracts";

/**
 * Example reference ranges, UNVALIDATED and shown only as context beside the personal baseline.
 * `worse` says which direction counts as a deviation worth flagging.
 */
export const metricCatalog: Record<MetricId, { unit: string; decimals: number; example: { min: number; max: number }; worse: "higher" | "lower" | "either" }> = {
  f0: { unit: "Hz", decimals: 0, example: { min: 85, max: 180 }, worse: "either" },
  jitter: { unit: "%", decimals: 2, example: { min: 0.2, max: 1.0 }, worse: "higher" },
  shimmer: { unit: "%", decimals: 1, example: { min: 1.0, max: 3.8 }, worse: "higher" },
  hnr: { unit: "dB", decimals: 1, example: { min: 20, max: 30 }, worse: "lower" },
  mpt: { unit: "s", decimals: 1, example: { min: 15, max: 25 }, worse: "lower" },
};

export const metricOrder: MetricId[] = ["f0", "jitter", "shimmer", "hnr", "mpt"];

/** Deviation thresholds in baseline standard deviations. Sample values. */
export const deviationThresholds = { watch: 1, deviation: 2 };
