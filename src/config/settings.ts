import { defaultRiskBands } from "./risk-bands";

/** Defaults for a new workspace. All values are samples; thresholds need clinical validation. */
export const defaultSettings = {
  profile: { fullName: "Dr. Elena Morales", specialty: "Pulmonology", email: "elena.morales@riverside.example", institution: "Riverside Clinic", country: "Argentina", city: "Buenos Aires", license: "MN 123456" },
  notifications: { push: true, email: true, severities: { high: true, moderate: true, low: false }, quiet: true, quietFrom: "21:00", quietTo: "07:00", daily: true, dailyAt: "08:00" },
  thresholds: { moderateFrom: defaultRiskBands.moderateFrom, highFrom: defaultRiskBands.highFrom, sustainedPts: 10, sustainedTests: 3, rapidPts: 18, rapidDays: 14, missedTests: 2, poorCount: 2, poorDays: 7 },
  team: { shared: true },
  security: { idleMinutes: 15 },
  help: { tips: true },
} as const;

export const idleOptions = [5, 10, 15, 30] as const;
