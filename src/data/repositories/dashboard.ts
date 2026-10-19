import { bandFor } from "@/config/risk-bands";
import { dashboardSchema, type Dashboard } from "../schemas";
import { dashboardFixture } from "../fixtures/dashboard";
import { DemoError, simulateLatency, type DemoState } from "../demo-state";

const emptyDashboard = {
  kpis: { activePatients: 0, openAlerts: 0, highPriorityAlerts: 0, resultsToReview: 0, receivedThisMorning: 0, overdueTests: 0 },
  queue: [],
  activity: [],
  distribution: { low: 0, moderate: 0, high: 0, noRecording: 0 },
  pendingActions: 0,
};

export async function getDashboard(demo?: DemoState): Promise<Dashboard> {
  await simulateLatency();
  if (demo === "error") throw new DemoError();
  if (demo === "empty") return dashboardSchema.parse(emptyDashboard);
  // Band is derived from the institution thresholds, never stored as a literal in the UI.
  const data = { ...dashboardFixture, queue: dashboardFixture.queue.map((q) => ({ ...q, band: bandFor(q.riskIndex) })) };
  return dashboardSchema.parse(data);
}
