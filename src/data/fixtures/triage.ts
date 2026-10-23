// FICTIONAL triage history for the demo: invented people, answers and spirometry results.
import { DEMO_NOW } from "@/config/demo";
import { BOOK_BY_DEFAULT, OBSTRUCTION_RATIO, priorityFor, pumaScore, RETRIAGE_MONTHS, type PumaAnswers, type VoiceSignal } from "@/config/triage";
import { slotSchema, triageSchema, type Slot, type Triage } from "../schemas";

const DAY = 86_400_000;
export const HOSPITAL_PLACE = "Hospital Riverside · Pulmonology, 2nd floor";
export const CENTRES = ["CAPS 12 · Villa Norte", "CAPS 7 · Barrio Sur", "CAPS 3 · Centro"] as const;

let seed = 4242;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const first = ["Ana", "Carlos", "Marta", "Jorge", "Silvia", "Raúl", "Norma", "Héctor", "Graciela", "Oscar", "Liliana", "Miguel", "Susana", "Rubén", "Alicia", "Daniel"];
const last = ["Gómez", "Díaz", "Pereyra", "Sosa", "Romero", "Álvarez", "Benítez", "Acosta", "Medina", "Herrera", "Suárez", "Aguirre"];
const iso = (ms: number) => new Date(ms).toISOString();

function person(i: number, now: number): Triage {
  const copd = rnd() < 0.2;
  // People with COPD in the fixture are older, smoked more and report more symptoms, as in the PUMA study.
  const answers: PumaAnswers = {
    sex: rnd() < (copd ? 0.6 : 0.45) ? "m" : "f", age: (copd ? 52 : 40) + Math.floor(rnd() * (copd ? 26 : 34)), packYears: (copd ? 20 : 10) + Math.floor(rnd() * (copd ? 35 : 30)),
    dyspnea: rnd() < (copd ? 0.75 : 0.4), phlegm: rnd() < (copd ? 0.6 : 0.3), cough: rnd() < (copd ? 0.65 : 0.35), priorSpirometry: rnd() < (copd ? 0.25 : 0.12),
  };
  const score = pumaScore(answers);
  const vr = rnd();
  const voice: VoiceSignal = copd ? (vr < 0.4 ? "high" : vr < 0.75 ? "moderate" : "low") : (vr < 0.12 ? "high" : vr < 0.42 ? "moderate" : "low");
  const priority = priorityFor(score, voice);
  const at = now - (2 + Math.floor(rnd() * 56)) * DAY - Math.floor(rnd() * 8) * 3_600_000;
  const override = !BOOK_BY_DEFAULT[priority] && rnd() < (priority === "medium" ? 0.3 : 0.05);
  const referred = BOOK_BY_DEFAULT[priority] || override;
  const t: Triage = {
    id: `tr-${100 + i}`, code: `TR-${2400 + i}`, patientId: `tp-${100 + i}`, patientName: `${pick(first)} ${pick(last)}`, centre: pick(CENTRES), by: pick(["Agente sanitario M. López", "Enf. R. Castro", "Dra. P. Ibáñez"]),
    at: iso(at), answers, pumaScore: score, voice, priority, override, worsening: false,
    retriageOn: priority !== "high" && !override ? iso(at + RETRIAGE_MONTHS[priority] * 30 * DAY).slice(0, 10) : undefined, monitoringStarted: false,
  };
  if (referred) {
    // Appointments sit on the hospital's morning slots (08:00 to 10:30, Buenos Aires time).
    const day = new Date(at + (5 + Math.floor(rnd() * 14)) * DAY).toISOString().slice(0, 10);
    const appt = Date.parse(`${day}T${String(8 + Math.floor(rnd() * 3)).padStart(2, "0")}:${rnd() < 0.5 ? "00" : "30"}:00-03:00`);
    t.referral = { slotId: `sl-past-${i}`, at: iso(appt), place: HOSPITAL_PLACE, bookedAt: iso(at) };
    // The last few days are still waiting for the technician to enter the result.
    if (appt < now - 3 * DAY) {
      const r = rnd();
      t.spirometry = r < 0.84
        ? { status: "done", ratio: Math.round((copd ? 0.5 + rnd() * 0.19 : 0.71 + rnd() * 0.12) * 100) / 100, obstruction: copd, enteredBy: "Téc. L. Funes", enteredAt: iso(appt + 3_600_000) }
        : r < 0.94 ? { status: "no_show", enteredBy: "Téc. L. Funes", enteredAt: iso(appt + 3_600_000) }
        : { status: "patient_reported", obstruction: copd, enteredBy: "CAPS", enteredAt: iso(appt + 62 * DAY) };
      if (t.spirometry.ratio !== undefined) t.spirometry.obstruction = t.spirometry.ratio < OBSTRUCTION_RATIO;
    }
  }
  return triageSchema.parse(t);
}

const now = Date.parse(DEMO_NOW);
export const triagesSeed: Triage[] = Array.from({ length: 140 }, (_, i) => person(i, now)).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

/** Bookable spirometry slots at the partner hospital, next two weeks, weekday mornings. */
export const slotsSeed: Slot[] = (() => {
  const out: Slot[] = [];
  for (let d = 1; d <= 14; d++) {
    const day = new Date(now + d * DAY);
    const wd = day.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    for (const h of ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"]) {
      const at = `${day.toISOString().slice(0, 10)}T${h}:00-03:00`;
      out.push(slotSchema.parse({ id: `sl-${at.slice(0, 16).replace(/\D/g, "")}`, at, place: HOSPITAL_PLACE, taken: rnd() < 0.35 }));
    }
  }
  return out;
})();
