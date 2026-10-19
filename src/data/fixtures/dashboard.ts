// All data in this file is FICTIONAL. Thresholds are unvalidated samples.
export const dashboardFixture = {
  kpis: { activePatients: 128, openAlerts: 4, highPriorityAlerts: 1, resultsToReview: 8, receivedThisMorning: 3, overdueTests: 6 },
  queue: [
    { patientId: "p-001", name: "James Wilson", initials: "JW", reason: { rule: "risk_rise", points: 18, weeks: 2 }, at: "2026-10-16T08:42:00-03:00", riskIndex: 72, band: "high", confidence: 0.92, quality: "good", judgment: "pending" },
    { patientId: "p-002", name: "Maria Chen", initials: "MC", reason: { rule: "sustained_deviation" }, at: "2026-10-16T07:15:00-03:00", riskIndex: 54, band: "moderate", confidence: 0.9, quality: "good", judgment: "pending" },
    { patientId: "p-003", name: "Robert Davis", initials: "RD", reason: { rule: "missed_tests", count: 2 }, at: "2026-10-14T09:05:00-03:00", riskIndex: 49, band: "moderate", confidence: 0.88, quality: "good", judgment: "pending" },
  ],
  activity: [
    { type: "test_completed", name: "Ana Garcia", at: "2026-10-16T08:10:00-03:00", riskIndex: 23, band: "low", confidence: 0.94, quality: "good", judgment: "pending" },
    { type: "invite_accepted", name: "Sofia Patel", at: "2026-10-16T07:50:00-03:00" },
    { type: "plan_updated", name: "Maria Chen", at: "2026-10-15T16:35:00-03:00", frequency: "weekly_0900" },
  ],
  distribution: { low: 82, moderate: 34, high: 12, noRecording: 12 },
  pendingActions: 3,
};
