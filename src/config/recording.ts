import { defaultThresholds } from "@/ai/quality/gate";

/** Task lengths. Minimums mirror the server quality gate so the recorder never accepts a take the gate will reject. */
export const taskLimits = {
  sustained_vowel: { min: defaultThresholds.web_patient.minDurationSec.sustained_vowel, max: 25 },
  counting: { min: defaultThresholds.web_patient.minDurationSec.counting, max: 30 },
  cough: { min: defaultThresholds.web_patient.minDurationSec.cough, max: 15 },
} as const;

export const MIC_CHECK_SECONDS = 3;
export const MIC_STORAGE_KEY = "spiro_mic";
