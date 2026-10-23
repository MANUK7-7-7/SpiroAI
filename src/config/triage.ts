/**
 * Triage rules. SAMPLE, UNVALIDATED: the clinical study decides whether the voice signal is used at all.
 * Changing the priority logic needs product and clinical sign-off.
 */
export const eligibility = { minAge: 40, minPackYears: 10 } as const;

/**
 * PUMA questionnaire, WEIGHTED score (López Varela et al., Respirology 2016;21:1227-34).
 * Cut-off >=25: sensitivity 76.3%, specificity 69.3% in the PUMA study. Pack-years ">30" is read as 31 or more.
 */
export const puma = {
  sex: { f: 0, m: 2 },
  age: [{ from: 40, points: 0 }, { from: 50, points: 9 }, { from: 60, points: 16 }],
  packYears: [{ from: 0, points: 0 }, { from: 20, points: 1 }, { from: 31, points: 7 }],
  yesItems: { dyspnea: 8, phlegm: 3, cough: 3, priorSpirometry: 5 },
  /** At or above this score the questionnaire suggests spirometry. */
  cutoff: 25,
  max: 44,
} as const;

export type PumaAnswers = { sex: "f" | "m"; age: number; packYears: number; dyspnea: boolean; phlegm: boolean; cough: boolean; priorSpirometry: boolean };

const step = (value: number, table: readonly { from: number; points: number }[]) => [...table].reverse().find((r) => value >= r.from)?.points ?? 0;

export function pumaScore(a: PumaAnswers): number {
  return puma.sex[a.sex] + step(a.age, puma.age) + step(a.packYears, puma.packYears)
    + (a.dyspnea ? puma.yesItems.dyspnea : 0) + (a.phlegm ? puma.yesItems.phlegm : 0) + (a.cough ? puma.yesItems.cough : 0) + (a.priorSpirometry ? puma.yesItems.priorSpirometry : 0);
}

export type Priority = "high" | "medium" | "low";
export type VoiceSignal = "high" | "moderate" | "low" | "off";

/**
 * Two signals, shown separately on screen, combined into one priority for a breathing test.
 * Without the voice (switched off, failed, or not yet validated) the questionnaire alone decides.
 */
export function priorityFor(score: number, voice: VoiceSignal): Priority {
  const pumaPositive = score >= puma.cutoff;
  if (voice === "off") return pumaPositive ? "high" : "low";
  const voicePositive = voice === "high" || voice === "moderate";
  if (pumaPositive && voicePositive) return "high";
  if (pumaPositive || voice === "high") return "medium";
  return "low";
}

/** Spirometry is booked by default for a high priority only. Medium and low can always be referred anyway. */
export const BOOK_BY_DEFAULT: Record<Priority, boolean> = { high: true, medium: false, low: false };
/** A medium or low priority never closes the case: the person is triaged again. */
export const RETRIAGE_MONTHS: Record<Exclude<Priority, "high">, number> = { medium: 3, low: 6 };
/** Below this FEV1/FVC ratio (after bronchodilator) the spirometry shows obstruction, as GOLD uses. */
export const OBSTRUCTION_RATIO = 0.7;
/** Results missing after this many days are recorded from the patient's report and left out of accuracy figures. */
export const RESULT_FOLLOW_UP_DAYS = 60;
