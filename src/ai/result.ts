import { z } from "zod";
import { qualityLevelSchema, recordingSourceSchema, aiErrorCodeSchema, featuresSchema, metricIdSchema } from "./contracts";
import { riskBandSchema } from "@/data/schemas";

export const deviationFlagSchema = z.enum(["within", "watch", "deviation"]);
export type DeviationFlag = z.infer<typeof deviationFlagSchema>;

export const metricDeviationSchema = z.object({
  metric: metricIdSchema,
  value: z.number(),
  baseline: z.number().optional(),
  deltaPct: z.number().optional(),
  z: z.number().optional(),
  flag: deviationFlagSchema,
});
export type MetricDeviation = z.infer<typeof metricDeviationSchema>;

export const screeningStatusSchema = z.enum(["pending", "processing", "ready", "failed", "rejected_quality"]);
export type ScreeningStatus = z.infer<typeof screeningStatusSchema>;

/**
 * What the UI reads. Never the raw model output. Old results are never overwritten when a model
 * ships: re-scoring creates a new row.
 */
export const screeningResultSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  recordingId: z.string(),
  source: recordingSourceSchema,
  status: screeningStatusSchema,
  riskIndex: z.number().min(0).max(100).optional(),
  band: riskBandSchema.optional(),
  /** Change against the personal baseline, in index points. */
  changeVsBaseline: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  quality: z.object({ level: qualityLevelSchema, reasons: z.array(z.string()) }).optional(),
  features: featuresSchema.optional(),
  deviations: z.array(metricDeviationSchema).optional(),
  modelId: z.string().optional(),
  modelVersion: z.string().optional(),
  extractorVersion: z.string().optional(),
  isDemoModel: z.boolean().optional(),
  latencyMs: z.number().optional(),
  warnings: z.array(z.string()).default([]),
  error: z.object({ code: aiErrorCodeSchema, retryable: z.boolean(), message: z.string() }).optional(),
  /** Set when the AI is feature-flagged off. The UI shows "Analysis not available yet". */
  unavailable: z.boolean().optional(),
  retryOf: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
});
export type ScreeningResult = z.infer<typeof screeningResultSchema>;
