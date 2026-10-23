import { randomUUID } from "node:crypto";
import type { RiskBands } from "@/config/risk-bands";
import type { AudioTaskId, BaselineSnapshot, DeviceMeta, ModelInput, PatientContext, RecordingSource } from "./contracts";
import { AiError } from "./errors";
import type { ScreeningModelProvider } from "./provider";
import { changeVsBaseline, bandOf, computeDeviations, evaluateAlertRules, type AlertRuleSettings, type AlertTrigger } from "./postprocess";
import { runQualityGate, type GateThresholds, type RecordingMeasurement } from "./quality/gate";
import type { ScreeningResult } from "./result";

export type RecordingRecord = {
  id: string;
  patientId: string;
  source: RecordingSource;
  startedBy: { role: "patient" | "clinician"; id: string };
  device: DeviceMeta;
  takes: RecordingMeasurement[];
  /** Short-lived signed URLs, minted at job time. */
  signedUrls: () => Promise<Record<AudioTaskId, string>>;
  patientContext?: PatientContext;
  /** Protocol-specific gate thresholds (e.g. the short triage recording). Defaults to the source thresholds. */
  gateThresholds?: GateThresholds;
};

export interface PipelineDeps {
  /** null when the AI is feature-flagged off. */
  provider: ScreeningModelProvider | null;
  getRecording(id: string): Promise<RecordingRecord | undefined>;
  getBaseline(patientId: string): Promise<BaselineSnapshot | undefined>;
  history(patientId: string): Promise<ScreeningResult[]>;
  saveResult(result: ScreeningResult): Promise<void>;
  raiseAlerts(patientId: string, resultId: string, triggers: AlertTrigger[]): Promise<void>;
  audit(event: { action: string; subject: string; detail?: string }): Promise<void>;
  bands: RiskBands;
  alertRules: AlertRuleSettings;
  now: () => string;
}

/**
 * quality gate -> inference -> post-process -> persist -> alert rules.
 * Runs as a background job. Never invents or estimates a score: on any failure the result is
 * `failed`, `rejected_quality` or `pending`, with the reason.
 */
export async function runScreening(recordingId: string, deps: PipelineDeps, opts: { retryOf?: string } = {}): Promise<ScreeningResult> {
  const recording = await deps.getRecording(recordingId);
  if (!recording) throw new Error(`Unknown recording ${recordingId}`);
  const base = { id: randomUUID(), patientId: recording.patientId, recordingId, source: recording.source, warnings: [] as string[], retryOf: opts.retryOf, createdAt: deps.now() };
  const done = async (r: Omit<ScreeningResult, "id" | "patientId" | "recordingId" | "source" | "createdAt" | "retryOf" | "warnings"> & { warnings?: string[] }) => {
    const result: ScreeningResult = { ...base, ...r, warnings: r.warnings ?? [], completedAt: deps.now() };
    await deps.saveResult(result);
    return result;
  };

  // 1. Quality gate. A failing take never reaches the model.
  const gate = runQualityGate(recording.source, recording.device, recording.takes, recording.gateThresholds);
  if (!gate.pass) {
    const rejected = await done({ status: "rejected_quality", quality: { level: "poor", reasons: gate.reasons }, error: { code: "QUALITY_REJECTED", retryable: false, message: "Recording quality too low. Ask the patient to repeat the test." } });
    await deps.audit({ action: "screening.rejected_quality", subject: recordingId, detail: gate.reasons.join(",") });
    await deps.raiseAlerts(recording.patientId, rejected.id, evaluateAlertRules([rejected, ...(await deps.history(recording.patientId))], deps.now(), deps.alertRules));
    return rejected;
  }

  // 2. AI feature flag off: the app keeps working; results show "Analysis not available yet".
  if (!deps.provider) return done({ status: "pending", unavailable: true, quality: { level: gate.level, reasons: gate.warnings } });

  // 3. Inference.
  const baseline = await deps.getBaseline(recording.patientId);
  const urls = await recording.signedUrls();
  const input: ModelInput = {
    recordingId: recording.id, // opaque; no patient identifiers cross this boundary
    source: recording.source,
    device: recording.device,
    tasks: recording.takes.map((t) => ({ task: t.task, url: urls[t.task], durationSec: t.durationSec, sampleRate: recording.device.sampleRate })),
    patientContext: recording.patientContext,
    baselineSnapshot: baseline,
  };
  try {
    const out = await deps.provider.infer(input);
    const result = await done({
      status: "ready",
      riskIndex: Math.round(out.riskIndex),
      subScores: out.subScores,
      band: bandOf(out.riskIndex, deps.bands),
      changeVsBaseline: changeVsBaseline(out.riskIndex, baseline),
      confidence: out.confidence,
      quality: { level: worse(out.quality.level, gate.level), reasons: [...out.quality.reasons, ...gate.warnings] },
      features: out.features,
      deviations: computeDeviations(out.features, baseline),
      modelId: out.modelId,
      modelVersion: out.modelVersion,
      extractorVersion: out.extractorVersion,
      isDemoModel: deps.provider.isDemo,
      latencyMs: out.latencyMs,
      warnings: out.warnings,
    });
    await deps.audit({ action: "screening.ready", subject: result.id });
    const hist = await deps.history(recording.patientId);
    await deps.raiseAlerts(recording.patientId, result.id, evaluateAlertRules([result, ...hist.filter((h) => h.id !== result.id)], deps.now(), deps.alertRules));
    return result;
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("MODEL_UNAVAILABLE", (e as Error).message);
    const status = err.code === "QUALITY_REJECTED" ? "rejected_quality" : "failed";
    const failed = await done({ status, error: { code: err.code, retryable: err.retryable, message: err.message }, quality: err.reasons.length ? { level: "poor", reasons: err.reasons } : undefined, isDemoModel: deps.provider.isDemo });
    await deps.audit({ action: `screening.${status}`, subject: recordingId, detail: err.code });
    return failed;
  }
}

const order = { good: 0, fair: 1, poor: 2 } as const;
const worse = (a: keyof typeof order, b: keyof typeof order) => (order[a] >= order[b] ? a : b);
