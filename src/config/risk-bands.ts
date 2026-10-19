/**
 * SAMPLE, UNVALIDATED thresholds. Configurable per institution in Settings > Alert thresholds.
 * Never hard-code these in UI components: always go through bandFor().
 */
export type RiskBand = "low" | "moderate" | "high";
export type RiskBands = { moderateFrom: number; highFrom: number };

export const defaultRiskBands: RiskBands = { moderateFrom: 40, highFrom: 70 };

export function bandFor(riskIndex: number, bands: RiskBands = defaultRiskBands): RiskBand {
  if (riskIndex >= bands.highFrom) return "high";
  if (riskIndex >= bands.moderateFrom) return "moderate";
  return "low";
}
