import type { ChartEvent, MonitoringPlan, Patient } from "@/data/schemas";

/**
 * SAMPLE, UNVALIDATED defaults. The frequency follows the clinical goal, not a fixed weekly rule:
 * screening looks for whom to refer to spirometry, stable COPD tracks the trend between visits,
 * and after an exacerbation the goal is to catch the next one early. Confirm with a pulmonologist.
 */
export const monitoringProfiles = {
  screening: { frequency: "semiannual", durationWeeks: 52, sensitivity: "standard" },
  stable: { frequency: "monthly", durationWeeks: 24, sensitivity: "standard" },
  post_exacerbation: { frequency: "weekly", durationWeeks: 6, sensitivity: "high", thenFrequency: "monthly" },
} as const satisfies Record<string, { frequency: MonitoringPlan["frequency"]; durationWeeks: number; sensitivity: MonitoringPlan["sensitivity"]; thenFrequency?: MonitoringPlan["frequency"] }>;

export type MonitoringProfile = keyof typeof monitoringProfiles;
export const profileIds = Object.keys(monitoringProfiles) as MonitoringProfile[];

/** An exacerbation within this window suggests the closer follow-up profile. */
export const RECENT_EXACERBATION_DAYS = 90;

export function suggestProfile(patient: Pick<Patient, "status" | "latest">, events: Pick<ChartEvent, "type" | "date">[], now: number): MonitoringProfile {
  if (patient.status === "at_risk") return "screening";
  const recent = events.some((e) => e.type === "exacerbation" && now - Date.parse(e.date) <= RECENT_EXACERBATION_DAYS * 86_400_000);
  return recent || patient.latest?.band === "high" ? "post_exacerbation" : "stable";
}
