import { defaultThresholds } from "@/ai/quality/gate";

/** Task lengths. Minimums mirror the server quality gate so the recorder never accepts a take the gate will reject. */
export const taskLimits = {
  sustained_vowel: { min: defaultThresholds.web_patient.minDurationSec.sustained_vowel, max: 25 },
  counting: { min: defaultThresholds.web_patient.minDurationSec.counting, max: 30 },
  cough: { min: defaultThresholds.web_patient.minDurationSec.cough, max: 15 },
} as const;

/** Triage protocol: the same three tasks, kept short (about 20 seconds in total). Sample values, unvalidated. */
export const triageTaskLimits = {
  sustained_vowel: { min: 5, max: 8 },
  counting: { min: 6, max: 10 },
  cough: { min: 2, max: 5 },
} as const;

export type RecordingProtocol = "monitoring" | "triage";

export const MIC_CHECK_SECONDS = 3;

/** How long a test link sent on WhatsApp stays valid. Sample value, set it with the clinical team. */
export const TEST_LINK_TTL_DAYS = 7;
export const MIC_STORAGE_KEY = "spiro_mic";
