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
  /** Mobile number for WhatsApp contact. Fixture numbers use an unassigned range and are fictional. */
  phone: z.string().optional(),
});
export type Patient = z.infer<typeof patientSchema>;

// ---------------------------------------------------------------------------------------------
// Results, reviews, events, plans, alerts. Results themselves live in src/ai/result.ts.
// ---------------------------------------------------------------------------------------------
export const reviewOutcomeSchema = z.enum(["no_concern", "follow_up", "repeat_requested", "unreliable"]);

export const clinicalReviewSchema = z.object({
  id: z.string(),
  resultId: z.string(),
  clinicianId: z.string(),
  clinicianName: z.string(),
  /** The doctor's judgment of the AI output. Stored as labelled feedback. */
  judgment: z.enum(["agree", "disagree"]),
  note: z.string().max(2000),
  outcome: reviewOutcomeSchema,
  /** Feedback is exported to the AI team only when this is true, and only de-identified. */
  shareDeidentifiedFeedback: z.boolean(),
  at: z.string().datetime({ offset: true }),
});
export type ClinicalReview = z.infer<typeof clinicalReviewSchema>;

export const recordingSummarySchema = z.object({
  recordingId: z.string(),
  source: z.enum(["mobile_app", "web_patient", "web_assisted"]),
  deviceLabel: z.string(),
  microphoneCheck: z.enum(["passed", "failed", "skipped"]),
  vowelSec: z.number(),
  readingSec: z.number(),
  noiseDb: z.number(),
  receivedAt: z.string().datetime({ offset: true }),
  /** Peak levels sampled for the waveform display. */
  waveform: z.array(z.number()).length(56),
});
export type RecordingSummary = z.infer<typeof recordingSummarySchema>;

export const chartEventSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  date: z.string(),
  type: z.enum(["medication", "spirometry", "doctor_note", "exacerbation", "other"]),
  detail: z.string(),
});
export type ChartEvent = z.infer<typeof chartEventSchema>;

export const alertSchema = z.object({
  id: z.string(),
  /** Clinic-facing code, e.g. AL-304. */
  code: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  severity: z.enum(["high", "moderate", "info"]),
  rule: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  resultId: z.string().optional(),
  state: z.enum(["open", "resolved", "dismissed"]),
  firedAt: z.string().datetime({ offset: true }),
  resolvedAt: z.string().datetime({ offset: true }).optional(),
  dismissedReason: z.string().optional(),
  /** Who resolved or dismissed it. */
  resolvedBy: z.string().optional(),
  /** Shown on resolved alerts, e.g. "Patient completed the scheduled recording." */
  resolution: z.string().optional(),
});
export type Alert = z.infer<typeof alertSchema>;

export const monitoringPlanSchema = z.object({
  patientId: z.string(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "semiannual"]),
  /** Which clinical goal the plan follows. Drives the suggested frequency. */
  profile: z.enum(["screening", "stable", "post_exacerbation"]).optional(),
  weekday: z.number().min(0).max(6).optional(),
  time: z.string(),
  sensitivity: z.enum(["standard", "high", "low"]),
  reminders: z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean() }),
  durationWeeks: z.number(),
  nextTestAt: z.string().datetime({ offset: true }),
  reviewOn: z.string(),
  adherence: z.object({ done: z.number(), scheduled: z.number() }),
});
export type MonitoringPlan = z.infer<typeof monitoringPlanSchema>;

export const clinicalDataSchema = z.object({
  patientId: z.string(),
  diagnosis: z.string(),
  goldStage: z.number().min(1).max(4).optional(),
  fev1Fvc: z.string(),
  fev1Pct: z.number(),
  previousSpirometry: z.string(),
  medications: z.array(z.object({ name: z.string(), detail: z.string(), role: z.string() })),
  smoking: z.string(),
  stopped: z.string().optional(),
  comorbidities: z.string(),
  allergies: z.string(),
  updatedBy: z.string(),
  updatedOn: z.string(),
});
export type ClinicalData = z.infer<typeof clinicalDataSchema>;

export const noteSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  author: z.string(),
  at: z.string().datetime({ offset: true }),
  text: z.string(),
  linkedResultId: z.string().optional(),
});
export type Note = z.infer<typeof noteSchema>;

export const clinicalActionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  alertId: z.string().optional(),
  resultId: z.string().optional(),
  kinds: z.array(z.enum(["spirometry", "follow_up_visit", "referral", "adjust_frequency", "repeat_test"])).min(1),
  followUp: z.object({ date: z.string(), time: z.string() }).optional(),
  messageToPatient: z.string().max(2000).optional(),
  internalNote: z.string().max(2000).optional(),
  notified: z.boolean(),
  /** Every action is initiated and confirmed by a clinician. */
  confirmedBy: z.string(),
  status: z.enum(["pending", "completed"]),
  at: z.string().datetime({ offset: true }),
});
export type ClinicalAction = z.infer<typeof clinicalActionSchema>;
