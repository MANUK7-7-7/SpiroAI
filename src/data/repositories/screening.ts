import { randomUUID } from "node:crypto";
import { AUDIO_TASKS, type AudioTaskId } from "@/ai/contracts";
import { resolveProvider } from "@/ai/registry";
import { runScreening, type PipelineDeps } from "@/ai/pipeline";
import { defaultAlertRules } from "@/ai/postprocess";
import type { ScreeningResult } from "@/ai/result";
import { signPath } from "@/lib/signed-url";
import { historyFor, type ResultRecord } from "../fixtures/history";
import { nextId, recordAudit, store } from "../store";
import { allPatients } from "./patients";
import { getBands, getSettings } from "./settings";

/** Fixture history plus results created from real recordings, oldest first. */
export function recordsFor(patientId: string): ResultRecord[] {
  return [...(historyFor(patientId)?.records ?? []), ...store.liveRecords.filter((r) => r.result.patientId === patientId)];
}

const alertSettings = () => {
  const t = getSettings().thresholds;
  return { ...defaultAlertRules, risePoints: t.rapidPts, riseWeeks: Math.max(1, Math.round(t.rapidDays / 7)), sustainedResults: t.sustainedTests, missedTests: t.missedTests, poorQualityRuns: t.poorCount };
};

const ageBand = (a: number) => (a < 40 ? "<40" : a < 50 ? "40-49" : a < 60 ? "50-59" : a < 70 ? "60-69" : a < 80 ? "70-79" : "80+") as "<40";
function patientContext(patientId: string) {
  const p = allPatients().find((x) => x.id === patientId);
  return p && { ageBand: ageBand(p.age), sex: p.sex, status: p.status, goldStage: p.gold, smoker: p.smoker };
}

const severityOf = { high: "high", moderate: "moderate" } as const;

function deps(): PipelineDeps {
  return {
    provider: resolveProvider(),
    bands: getBands(),
    alertRules: alertSettings(),
    now: () => new Date().toISOString(),
    async getRecording(id) {
      const s = store.recordings.get(id);
      if (!s) return undefined;
      return {
        id, patientId: s.patientId, source: s.source, startedBy: s.startedBy, device: s.device, takes: s.takes,
        signedUrls: async () => {
          const base = process.env.APP_ORIGIN ?? "http://localhost:3000";
          return Object.fromEntries(AUDIO_TASKS.map((task) => [task, base + signPath(`/api/audio/${id}/${task}`)])) as Record<AudioTaskId, string>;
        },
        // Opaque code only: the model never receives the patient's name or any identifier.
        patientContext: patientContext(s.patientId),
      };
    },
    async getBaseline(patientId) { return historyFor(patientId)?.baseline; },
    async history(patientId) { return recordsFor(patientId).map((r) => r.result).reverse(); },
    async saveResult(result: ScreeningResult) {
      const session = store.recordings.get(result.recordingId);
      const n = recordsFor(result.patientId).length + 1;
      const id = `r-${result.patientId}-${n}`;
      const saved = { ...result, id };
      const secondsOf = (task: AudioTaskId) => Math.round(session?.takes.find((t) => t.task === task)?.durationSec ?? 0);
      session && (session.resultId = id);
      store.liveRecords.push({
        result: saved, testCode: `T-${3000 + store.liveRecords.length}`,
        recording: {
          recordingId: result.recordingId, source: result.source, deviceLabel: session?.device.microphoneLabel ?? "Computer microphone", microphoneCheck: session?.micCheck ?? "skipped",
          vowelSec: secondsOf("sustained_vowel"), countingSec: secondsOf("counting"), coughSec: secondsOf("cough"),
          noiseDb: Math.max(0, Math.round(90 + (session?.takes[0]?.noiseFloorDb ?? -90))), receivedAt: result.createdAt, waveform: session?.waveform ?? Array(56).fill(0),
        },
      });
      Object.assign(result, saved);
    },
    async raiseAlerts(patientId, resultId, triggers) {
      const p = allPatients().find((x) => x.id === patientId);
      for (const tr of triggers) {
        if (store.alerts.some((a) => a.patientId === patientId && a.state === "open" && a.rule === tr.rule)) continue;
        const { rule, severity, ...params } = tr as typeof tr & { severity: string };
        store.alerts.unshift({
          id: nextId("a"), code: `AL-${300 + store.alerts.length}`, patientId, patientName: p?.name ?? patientId, severity: severityOf[severity as "high" | "moderate"] ?? "info",
          rule, params: params as Record<string, number>, resultId: resultId.startsWith("r-") ? resultId : undefined, state: "open", firedAt: new Date().toISOString(),
        });
      }
    },
    async audit(e) { recordAudit({ ...e, actor: "system" }); },
  };
}

/** Background job: never blocks the upload response, and never invents a score on failure. */
export function startScreening(recordingId: string, opts: { retryOf?: string } = {}) {
  const s = store.recordings.get(recordingId);
  if (!s) return;
  s.status = "processing";
  void runScreening(recordingId, deps(), opts)
    .catch((e) => recordAudit({ action: "screening.error", subject: recordingId, detail: (e as Error).message, actor: "system" }))
    .finally(() => { s.status = "done"; });
}

export const newRecordingSecret = () => randomUUID();
