import { defaultThresholds } from "@/ai/quality/gate";

/** Task lengths. Minimums mirror the server quality gate so the recorder never accepts a take the gate will reject. */
export const taskLimits = {
  sustained_vowel: { min: defaultThresholds.web_patient.minDurationSec.sustained_vowel, max: 25 },
  reading_passage: { min: defaultThresholds.web_patient.minDurationSec.reading_passage, max: 60 },
} as const;

/** Triage protocol: about 10 seconds in total (a sustained vowel and one short sentence). Sample values, unvalidated. */
export const triageTaskLimits = {
  sustained_vowel: { min: 5, max: 10 },
  reading_passage: { min: 3, max: 10 },
} as const;

export type RecordingProtocol = "monitoring" | "triage";

export const MIC_CHECK_SECONDS = 3;
export const MIC_STORAGE_KEY = "spiro_mic";
