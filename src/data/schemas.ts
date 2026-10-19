import { z } from "zod";

export const verificationStatus = z.enum(["submitted", "in_review", "approved", "rejected"]);
export const applicationSchema = z.object({
  id: z.string(),
  submittedAt: z.string().datetime({ offset: true }),
  status: verificationStatus,
  fullName: z.string(),
  licenseNumber: z.string(),
  institution: z.string(),
});
export type Application = z.infer<typeof applicationSchema>;

export const riskBandSchema = z.enum(["low", "moderate", "high"]);
export const qualitySchema = z.enum(["good", "fair", "poor"]);
export const resultStatusSchema = z.enum(["pending", "processing", "ready", "failed", "rejected_quality"]);
export const judgmentSchema = z.enum(["pending", "agreed", "disagreed"]);

/** Reasons an item is in the priority queue. Rendered through i18n, never free text from a model. */
export const queueReasonSchema = z.discriminatedUnion("rule", [
  z.object({ rule: z.literal("risk_rise"), points: z.number(), weeks: z.number() }),
  z.object({ rule: z.literal("sustained_deviation") }),
  z.object({ rule: z.literal("missed_tests"), count: z.number() }),
  z.object({ rule: z.literal("poor_quality"), count: z.number() }),
]);
export type QueueReason = z.infer<typeof queueReasonSchema>;

export const queueItemSchema = z.object({
  patientId: z.string(),
  name: z.string(),
  initials: z.string(),
  reason: queueReasonSchema,
  at: z.string().datetime({ offset: true }),
  riskIndex: z.number().min(0).max(100),
  band: riskBandSchema,
  confidence: z.number().min(0).max(1),
  quality: qualitySchema,
  judgment: judgmentSchema,
});
export type QueueItem = z.infer<typeof queueItemSchema>;

export const activityItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("test_completed"), name: z.string(), at: z.string().datetime({ offset: true }), riskIndex: z.number(), band: riskBandSchema, confidence: z.number(), quality: qualitySchema, judgment: judgmentSchema }),
  z.object({ type: z.literal("invite_accepted"), name: z.string(), at: z.string().datetime({ offset: true }) }),
  z.object({ type: z.literal("plan_updated"), name: z.string(), at: z.string().datetime({ offset: true }), frequency: z.string() }),
]);
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const dashboardSchema = z.object({
  kpis: z.object({
    activePatients: z.number(),
    openAlerts: z.number(),
    highPriorityAlerts: z.number(),
    resultsToReview: z.number(),
    receivedThisMorning: z.number(),
    overdueTests: z.number(),
  }),
  queue: z.array(queueItemSchema),
  activity: z.array(activityItemSchema),
  distribution: z.object({ low: z.number(), moderate: z.number(), high: z.number(), noRecording: z.number() }),
  pendingActions: z.number(),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

export const clinicianSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  initials: z.string(),
  institution: z.string(),
  verified: z.boolean(),
  unreadAlerts: z.number(),
  unreadMessages: z.number(),
});
export type Clinician = z.infer<typeof clinicianSchema>;

export const patientStatusSchema = z.enum(["diagnosed", "at_risk"]);
export const consentStateSchema = z.enum(["active", "pending", "revoked"]);

export const latestResultSchema = z.object({
  resultId: z.string(),
  riskIndex: z.number().min(0).max(100),
  band: riskBandSchema,
  confidence: z.number().min(0).max(1),
  quality: qualitySchema,
  judgment: judgmentSchema,
  at: z.string().datetime({ offset: true }),
  /** Change against the patient's personal baseline, in index points. */
  trend: z.number(),
});
export type LatestResult = z.infer<typeof latestResultSchema>;

export const patientSchema = z.object({
  id: z.string(),
  /** Opaque, clinic-facing code. This is the only identifier that ever leaves the app toward the model. */
  code: z.string(),
  name: z.string(),
  initials: z.string(),
  age: z.number(),
  sex: z.enum(["f", "m"]),
  status: patientStatusSchema,
  gold: z.number().min(1).max(4).optional(),
  smoker: z.enum(["never", "former", "current"]),
  consent: consentStateSchema,
  invitePending: z.boolean(),
  adherence: z.number().min(0).max(1).optional(),
  latest: latestResultSchema.optional(),
  featured: z.number().optional(),
});
export type Patient = z.infer<typeof patientSchema>;
