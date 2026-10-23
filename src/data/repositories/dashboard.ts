import { bandOf } from "./settings";
import { dashboardSchema, type Dashboard } from "../schemas";
import { dashboardFixture } from "../fixtures/dashboard";
import { highAlertCount, openAlertCount } from "./alerts";
import { allPatients } from "./patients";
import { store } from "../store";
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
  // Results patients sent from home that nobody has reviewed yet go to the top of the queue.
  const live = [...store.liveRecords].reverse().filter((r) => r.result.status === "ready" && r.result.riskIndex !== undefined);
  const unreviewed = live.filter((r) => !store.reviews.has(r.result.id));
  const name = (id: string) => allPatients().find((p) => p.id === id);
  const today = new Date().toDateString();
  const liveQueue = unreviewed.map((r) => {
    const p = name(r.result.patientId);
    return {
      patientId: r.result.patientId, resultId: r.result.id, name: p?.name ?? r.result.patientId, initials: p?.initials ?? "?", reason: { rule: "new_result" as const },
      at: r.result.completedAt ?? r.result.createdAt, riskIndex: r.result.riskIndex!, confidence: r.result.confidence ?? 0, quality: r.result.quality?.level ?? "good", judgment: "pending" as const,
    };
  });
  const liveActivity = live.slice(0, 5).map((r) => ({
    type: "test_completed" as const, name: name(r.result.patientId)?.name ?? r.result.patientId, at: r.result.completedAt ?? r.result.createdAt,
    riskIndex: r.result.riskIndex!, band: bandOf(r.result.riskIndex!), confidence: r.result.confidence ?? 0, quality: r.result.quality?.level ?? "good",
    judgment: store.reviews.get(r.result.id) ? (store.reviews.get(r.result.id)!.judgment === "agree" ? "agreed" as const : "disagreed" as const) : "pending" as const,
  }));
  // Band is derived from the institution thresholds, never stored as a literal in the UI.
  const data = {
    ...dashboardFixture,
    kpis: {
      ...dashboardFixture.kpis, openAlerts: openAlertCount(), highPriorityAlerts: highAlertCount(),
      resultsToReview: dashboardFixture.kpis.resultsToReview + unreviewed.length,
      receivedThisMorning: dashboardFixture.kpis.receivedThisMorning + live.filter((r) => new Date(r.result.createdAt).toDateString() === today).length,
    },
    queue: [...liveQueue, ...dashboardFixture.queue].map((q) => ({ ...q, band: bandOf(q.riskIndex) })),
    activity: [...liveActivity, ...dashboardFixture.activity],
  };
  return dashboardSchema.parse(data);
}
