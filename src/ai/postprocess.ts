import { bandFor, type RiskBands } from "@/config/risk-bands";
import { deviationThresholds, metricCatalog, metricOrder } from "@/config/metrics";
import type { BaselineSnapshot, Features, MetricId } from "./contracts";
import type { MetricDeviation, ScreeningResult } from "./result";

const valueOf = (f: Features, m: MetricId) => ({ f0: f.f0Hz, jitter: f.jitterPct, shimmer: f.shimmerPct, hnr: f.hnrDb, mpt: f.mptSec })[m];

/** Per-metric deviation from the patient's own baseline. Without a baseline everything is "within" and unscored. */
export function computeDeviations(features: Features, baseline?: BaselineSnapshot): MetricDeviation[] {
  return metricOrder.map((metric) => {
    const value = valueOf(features, metric);
    const b = baseline?.metrics[metric];
    if (!b) return { metric, value, flag: "within" as const };
    const z = b.sd > 0 ? (value - b.mean) / b.sd : 0;
    const worse = metricCatalog[metric].worse;
    const badZ = worse === "higher" ? z : worse === "lower" ? -z : Math.abs(z);
    const flag = badZ >= deviationThresholds.deviation ? "deviation" : badZ >= deviationThresholds.watch ? "watch" : "within";
    return { metric, value, baseline: b.mean, deltaPct: b.mean !== 0 ? ((value - b.mean) / b.mean) * 100 : undefined, z, flag };
  });
}

export const changeVsBaseline = (riskIndex: number, baseline?: BaselineSnapshot) => (baseline?.riskIndex === undefined ? undefined : Math.round(riskIndex - baseline.riskIndex));

export function bandOf(riskIndex: number, bands: RiskBands) {
  return bandFor(riskIndex, bands);
}

// ---------------------------------------------------------------------------------------------
// Alert rules. Sample defaults; configurable per institution in Settings > Alert thresholds.
// Alerts only ever ask a clinician to look. The AI never takes a clinical action on its own.
// ---------------------------------------------------------------------------------------------

export type AlertRuleSettings = { risePoints: number; riseWeeks: number; sustainedResults: number; missedTests: number; poorQualityRuns: number; expectedIntervalDays: number };
export const defaultAlertRules: AlertRuleSettings = { risePoints: 15, riseWeeks: 2, sustainedResults: 3, missedTests: 2, poorQualityRuns: 3, expectedIntervalDays: 7 };

export type AlertTrigger =
  | { rule: "risk_rise"; points: number; weeks: number; severity: "high" | "moderate" }
  | { rule: "sustained_deviation"; results: number; severity: "moderate" }
  | { rule: "missed_tests"; count: number; severity: "moderate" }
  | { rule: "poor_quality"; count: number; severity: "moderate" };

const DAY = 86_400_000;

/** `history` is newest first. */
export function evaluateAlertRules(history: ScreeningResult[], now: string, settings: AlertRuleSettings = defaultAlertRules): AlertTrigger[] {
  const out: AlertTrigger[] = [];
  const nowMs = Date.parse(now);
  const ready = history.filter((r) => r.status === "ready" && r.riskIndex !== undefined);

  // 1. Risk rose N points within M weeks.
  const latest = ready[0];
  if (latest) {
    const windowStart = nowMs - settings.riseWeeks * 7 * DAY;
    const inWindow = ready.filter((r) => Date.parse(r.createdAt) >= windowStart);
    const oldest = inWindow[inWindow.length - 1];
    if (oldest && oldest !== latest) {
      const rise = latest.riskIndex! - oldest.riskIndex!;
      if (rise >= settings.risePoints) out.push({ rule: "risk_rise", points: Math.round(rise), weeks: settings.riseWeeks, severity: latest.band === "high" ? "high" : "moderate" });
    }
  }

  // 2. Sustained deviation: the last K ready results each have at least one deviation flag.
  const lastK = ready.slice(0, settings.sustainedResults);
  if (lastK.length === settings.sustainedResults && lastK.every((r) => r.deviations?.some((d) => d.flag === "deviation"))) {
    out.push({ rule: "sustained_deviation", results: settings.sustainedResults, severity: "moderate" });
  }

  // 3. Missed scheduled tests since the last recording.
  const lastAt = history.length ? Math.max(...history.map((r) => Date.parse(r.createdAt))) : undefined;
  if (lastAt !== undefined) {
    const missed = Math.floor((nowMs - lastAt) / (settings.expectedIntervalDays * DAY)) - 1;
    if (missed >= settings.missedTests) out.push({ rule: "missed_tests", count: missed, severity: "moderate" });
  }

  // 4. Repeated poor-quality recordings, newest first, unbroken run.
  let run = 0;
  for (const r of history) {
    if (r.status === "rejected_quality" || r.quality?.level === "poor") run++;
    else break;
  }
  if (run >= settings.poorQualityRuns) out.push({ rule: "poor_quality", count: run, severity: "moderate" });

  return out;
}
