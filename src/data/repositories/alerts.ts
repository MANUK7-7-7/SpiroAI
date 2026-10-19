import { DemoError, simulateLatency, type DemoState } from "../demo-state";
import { store, nextId, recordAudit } from "../store";
import type { Alert } from "../schemas";

const order = { high: 0, moderate: 1, info: 2 } as const;

export async function listAlerts(state: "open" | "resolved", demo?: DemoState): Promise<Alert[]> {
  await simulateLatency(200);
  if (demo === "error") throw new DemoError();
  if (demo === "empty") return [];
  const items = store.alerts.filter((a) => (state === "open" ? a.state === "open" : a.state !== "open"));
  return items.sort((a, b) => (state === "open" ? order[a.severity] - order[b.severity] : 0) || Date.parse(b.firedAt) - Date.parse(a.firedAt));
}

export const openAlertCount = () => store.alerts.filter((a) => a.state === "open").length;
export const highAlertCount = () => store.alerts.filter((a) => a.state === "open" && a.severity === "high").length;
export const getAlert = (id: string) => store.alerts.find((a) => a.id === id);

/** A dismissal always carries a reason and the clinician. The result and history are never deleted. */
export async function dismissAlert(id: string, reason: string, by: string) {
  const a = getAlert(id);
  if (!a || a.state !== "open") return undefined;
  a.state = "dismissed";
  a.dismissedReason = reason;
  a.resolvedBy = by;
  a.resolvedAt = new Date().toISOString().replace("Z", "+00:00");
  recordAudit({ action: "alert.dismissed", subject: id, detail: reason });
  return a;
}

export function resolveAlert(id: string, by: string, resolution: string) {
  const a = getAlert(id);
  if (!a || a.state !== "open") return;
  a.state = "resolved";
  a.resolvedBy = by;
  a.resolution = resolution;
  a.resolvedAt = new Date().toISOString().replace("Z", "+00:00");
  recordAudit({ action: "alert.resolved", subject: id });
}

export const auditFor = (subject: string) => store.audit.filter((e) => e.subject === subject);
export { nextId };
