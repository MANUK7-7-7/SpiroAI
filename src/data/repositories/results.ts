import type { ScreeningResult } from "@/ai/result";
import { DemoError, simulateLatency, type DemoState } from "../demo-state";
import { historyFor, type ResultRecord } from "../fixtures/history";
import { clinicalFor, planFor } from "../fixtures/profile";
import { allPatients } from "./patients";
import { store, nextId, recordAudit } from "../store";
import { bandOf } from "./settings";
import { clinicalReviewSchema, type Alert, type ChartEvent, type ClinicalData, type ClinicalReview, type MonitoringPlan, type Note, type Patient } from "../schemas";

export type ResultView = ResultRecord & { review?: ClinicalReview };

const withReview = (r: ResultRecord): ResultView => ({ ...r, result: r.result.riskIndex === undefined ? r.result : { ...r.result, band: bandOf(r.result.riskIndex) }, review: store.reviews.get(r.result.id) ?? r.review });

const effectiveJudgment = (r: ResultView): "pending" | "agreed" | "disagreed" => (r.review ? (r.review.judgment === "agree" ? "agreed" : "disagreed") : "pending");

/** Newest first. Judgment reflects reviews saved this session. */
export async function listRecords(patientId: string, demo?: DemoState): Promise<ResultView[]> {
  await simulateLatency(200);
  if (demo === "error") throw new DemoError();
  if (demo === "empty") return [];
  return (historyFor(patientId)?.records ?? []).map(withReview).reverse();
}

export async function getRecord(resultId: string, demo?: DemoState): Promise<{ record: ResultView; prevId?: string; nextId?: string; patient: Patient } | undefined> {
  await simulateLatency(200);
  if (demo === "error") throw new DemoError();
  const patientId = resultId.match(/^r-(p-\d+)-\d+$/)?.[1];
  if (!patientId) return undefined;
  const patient = allPatients().find((p) => p.id === patientId);
  const all = historyFor(patientId)?.records ?? [];
  const i = all.findIndex((r) => r.result.id === resultId);
  if (!patient || i < 0) return undefined;
  recordAudit({ action: "result.read", subject: resultId });
  return { record: withReview(all[i]), prevId: all[i - 1]?.result.id, nextId: all[i + 1]?.result.id, patient };
}

export async function getLatestRecord(patientId: string): Promise<ResultView | undefined> {
  const all = historyFor(patientId)?.records;
  return all?.length ? withReview(all[all.length - 1]) : undefined;
}

export const reviewLabelKey = (r: ResultView): { key: string; vars: Record<string, string> } => {
  if (!r.review) return { key: "judgment.pendingReview", vars: {} };
  if (r.review.outcome === "unreliable") return { key: "judgment.repeatUnreliable", vars: {} };
  if (r.review.outcome === "no_concern") return { key: "judgment.noConcern", vars: {} };
  return { key: r.review.judgment === "agree" ? "judgment.reviewedAgree" : "judgment.reviewedDisagree", vars: { who: r.review.clinicianName } };
};

export async function submitReview(input: { resultId: string; judgment: "agree" | "disagree"; note: string; outcome: ClinicalReview["outcome"]; shareDeidentifiedFeedback: boolean; clinicianId: string; clinicianName: string }) {
  const review = clinicalReviewSchema.parse({ id: nextId("rv"), ...input, at: new Date().toISOString().replace("Z", "+00:00") });
  store.reviews.set(input.resultId, review);
  recordAudit({ action: "review.saved", subject: input.resultId, detail: `${review.judgment}${review.shareDeidentifiedFeedback ? " · feedback shared (de-identified)" : ""}` });
  return review;
}

/** Labelled feedback for the AI team: only reviews with consent, and only de-identified fields. */
export function exportDeidentifiedFeedback() {
  return [...store.reviews.values()]
    .filter((r) => r.shareDeidentifiedFeedback)
    .map((r) => {
      const rec = [...(historyFor(r.resultId.match(/^r-(p-\d+)-/)![1])?.records ?? [])].find((x) => x.result.id === r.resultId);
      return { modelId: rec?.result.modelId, modelVersion: rec?.result.modelVersion, riskIndex: rec?.result.riskIndex, confidence: rec?.result.confidence, judgment: r.judgment, outcome: r.outcome };
    });
}

export type Profile = { patient: Patient; latest?: ResultView; plan?: MonitoringPlan; alerts: Alert[]; events: ChartEvent[]; clinical?: ClinicalData; notes: Note[]; history?: ReturnType<typeof historyFor>; recordCount: number };

export async function getProfile(patientId: string, demo?: DemoState): Promise<Profile | undefined> {
  await simulateLatency(200);
  if (demo === "error") throw new DemoError();
  const patient = allPatients().find((p) => p.id === patientId);
  if (!patient) return undefined;
  const raw = historyFor(patientId);
  const history = raw && { ...raw, records: raw.records.map((r) => withReview(r)) };
  return {
    patient, latest: await getLatestRecord(patientId), plan: store.plans.get(patientId) ?? planFor(patientId), history,
    alerts: store.alerts.filter((a) => a.patientId === patientId && a.state === "open"), events: store.events.filter((e) => e.patientId === patientId),
    clinical: clinicalFor(patientId), notes: store.notes.filter((n) => n.patientId === patientId), recordCount: history?.records.length ?? 0,
  };
}

export async function addNote(patientId: string, text: string, author: string) {
  const note: Note = { id: nextId("n"), patientId, author, at: new Date().toISOString().replace("Z", "+00:00"), text };
  store.notes.unshift(note);
  recordAudit({ action: "note.added", subject: patientId });
  return note;
}

export async function addEvent(e: Omit<ChartEvent, "id">) {
  const ev = { id: nextId("ev"), ...e };
  store.events.push(ev);
  recordAudit({ action: "event.added", subject: e.patientId });
  return ev;
}

export { effectiveJudgment };
export type { ScreeningResult };
