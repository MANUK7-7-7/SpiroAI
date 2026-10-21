/**
 * Single source of truth for what crosses the model boundary.
 * Mirrored by services/inference/openapi.json. Change both together.
 *
 * PRIVACY: nothing in here identifies a patient. Recordings are referenced by opaque IDs and
 * short-lived signed URLs. Names, national IDs, emails and clinician IDs never reach the model.
 */
import { z } from "zod";

export const recordingSourceSchema = z.enum(["mobile_app", "web_patient", "web_assisted"]);
export type RecordingSource = z.infer<typeof recordingSourceSchema>;

/**
 * The recorded tasks, in recording order. They match what the models were trained on:
 * sustained vowel and counting 1 to 20 feed the voice model, the cough feeds the cough model.
 */
export const AUDIO_TASKS = ["sustained_vowel", "counting", "cough"] as const;
export const audioTaskIdSchema = z.enum(AUDIO_TASKS);
export type AudioTaskId = z.infer<typeof audioTaskIdSchema>;

/** What the browser or phone actually applied, read back from the track settings. */
export const deviceMetaSchema = z.object({
  deviceType: z.enum(["phone", "tablet", "laptop", "desktop", "unknown"]),
  os: z.string().max(64).optional(),
  browser: z.string().max(64).optional(),
  microphoneLabel: z.string().max(128).optional(),
  microphoneKind: z.enum(["built_in", "external", "unknown"]),
  sampleRate: z.number().int().min(8000).max(192000),
  channelCount: z.number().int().min(1).max(8),
  processing: z.object({ echoCancellation: z.boolean(), noiseSuppression: z.boolean(), autoGainControl: z.boolean() }),
});
export type DeviceMeta = z.infer<typeof deviceMetaSchema>;

export const audioTaskInputSchema = z.object({
  task: audioTaskIdSchema,
  /** Short-lived signed URL to uncompressed PCM (WAV or FLAC). Never a lossy codec. */
  url: z.string().url(),
  durationSec: z.number().positive(),
  sampleRate: z.number().int(),
});
export type AudioTaskInput = z.infer<typeof audioTaskInputSchema>;

export const metricIdSchema = z.enum(["f0", "jitter", "shimmer", "hnr", "mpt"]);
export type MetricId = z.infer<typeof metricIdSchema>;

export const baselineSnapshotSchema = z.object({
  window: z.object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }) }),
  method: z.enum(["median_first_n", "rolling_median"]),
  sampleCount: z.number().int().min(1),
  metrics: z.record(metricIdSchema, z.object({ mean: z.number(), sd: z.number().nonnegative() })),
  riskIndex: z.number().min(0).max(100).optional(),
});
export type BaselineSnapshot = z.infer<typeof baselineSnapshotSchema>;

export const patientContextSchema = z.object({
  ageBand: z.enum(["<40", "40-49", "50-59", "60-69", "70-79", "80+"]).optional(),
  sex: z.enum(["f", "m"]).optional(),
  status: z.enum(["diagnosed", "at_risk"]).optional(),
  goldStage: z.number().int().min(1).max(4).optional(),
  smoker: z.enum(["never", "former", "current"]).optional(),
});
export type PatientContext = z.infer<typeof patientContextSchema>;

export const modelInputSchema = z.object({
  recordingId: z.string().min(1),
  tasks: z.array(audioTaskInputSchema).min(1).max(AUDIO_TASKS.length),
  source: recordingSourceSchema,
  device: deviceMetaSchema,
  patientContext: patientContextSchema.optional(),
  baselineSnapshot: baselineSnapshotSchema.optional(),
});
export type ModelInput = z.infer<typeof modelInputSchema>;

export const qualityLevelSchema = z.enum(["good", "fair", "poor"]);
export type QualityLevel = z.infer<typeof qualityLevelSchema>;

export const featuresSchema = z.object({
  f0Hz: z.number(),
  jitterPct: z.number(),
  shimmerPct: z.number(),
  hnrDb: z.number(),
  mptSec: z.number(),
  mfcc: z.array(z.number()).max(40),
});
export type Features = z.infer<typeof featuresSchema>;

/**
 * One score per modality, so the clinician can see where the combined index comes from.
 * `target` names what that model was trained to recognise; the two differ.
 */
export const subScoreSchema = z.object({
  riskIndex: z.number().min(0).max(100),
  target: z.enum(["chronic_lung_disease", "copd"]),
  tasks: z.array(audioTaskIdSchema).min(1),
});
export type SubScore = z.infer<typeof subScoreSchema>;

export const subScoresSchema = z.object({ voice: subScoreSchema.optional(), cough: subScoreSchema.optional() });
export type SubScores = z.infer<typeof subScoresSchema>;

export const modelOutputSchema = z.object({
  riskIndex: z.number().min(0).max(100),
  subScores: subScoresSchema.optional(),
  confidence: z.number().min(0).max(1),
  quality: z.object({ level: qualityLevelSchema, reasons: z.array(z.string()) }),
  features: featuresSchema,
  featureContributions: z.record(z.string(), z.number()).optional(),
  modelId: z.string().min(1),
  modelVersion: z.string().min(1),
  extractorVersion: z.string().min(1),
  latencyMs: z.number().nonnegative(),
  warnings: z.array(z.string()),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

export const aiErrorCodeSchema = z.enum(["QUALITY_REJECTED", "MODEL_UNAVAILABLE", "TIMEOUT", "INVALID_INPUT"]);
export type AiErrorCode = z.infer<typeof aiErrorCodeSchema>;

export const aiErrorBodySchema = z.object({ code: aiErrorCodeSchema, message: z.string(), reasons: z.array(z.string()).optional() });
export type AiErrorBody = z.infer<typeof aiErrorBodySchema>;
