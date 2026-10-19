// FICTIONAL clinical context. Not real patient data.
import { clinicalDataSchema, monitoringPlanSchema, type Alert, type ChartEvent, type ClinicalData, type MonitoringPlan, type Note } from "../schemas";
import { patientsFixture } from "./patients";

const jamesClinical = {
  patientId: "p-001", diagnosis: "COPD · Diagnosed 2024", goldStage: 2, fev1Fvc: "0.62 · 12 Sep 2026", fev1Pct: 68,
  previousSpirometry: "15 Mar 2026 · Ratio 0.64 · FEV₁ 70%",
  medications: [
    { name: "Tiotropium", detail: "18 μg inhaled daily", role: "Started 15 Sep 2026 · Maintenance" },
    { name: "Salbutamol", detail: "100 μg as needed", role: "Rescue inhaler · Last reviewed 02 Oct" },
  ],
  smoking: "former smoker · 35 pack-years", stopped: "2021", comorbidities: "hypertension", allergies: "no known drug allergies",
  updatedBy: "Dr. Elena Morales", updatedOn: "2026-10-02",
};

export function clinicalFor(patientId: string): ClinicalData | undefined {
  if (patientId === "p-001") return clinicalDataSchema.parse(jamesClinical);
  const p = patientsFixture.find((x) => x.id === patientId);
  if (!p) return undefined;
  return clinicalDataSchema.parse({
    patientId, diagnosis: p.status === "diagnosed" ? "COPD · Diagnosed 2023" : "No COPD diagnosis · At risk", goldStage: p.gold,
    fev1Fvc: p.status === "diagnosed" ? "0.66 · 20 Aug 2026" : "Not measured", fev1Pct: p.status === "diagnosed" ? 72 : 90,
    previousSpirometry: p.status === "diagnosed" ? "10 Feb 2026 · Ratio 0.67 · FEV₁ 74%" : "None on file",
    medications: p.status === "diagnosed" ? [{ name: "Tiotropium", detail: "18 μg inhaled daily", role: "Maintenance" }] : [],
    smoking: p.smoker === "never" ? "never smoker" : p.smoker === "former" ? "former smoker · 20 pack-years" : "current smoker · 25 pack-years",
    stopped: p.smoker === "former" ? "2019" : undefined, comorbidities: "none recorded", allergies: "no known drug allergies",
    updatedBy: "Dr. Elena Morales", updatedOn: "2026-09-20",
  });
}

export function planFor(patientId: string): MonitoringPlan | undefined {
  const p = patientsFixture.find((x) => x.id === patientId);
  if (!p || p.invitePending) return undefined;
  const james = patientId === "p-001";
  return monitoringPlanSchema.parse({
    patientId, frequency: "weekly", weekday: 5, time: "09:00", sensitivity: "standard",
    reminders: { push: true, email: true, sms: false }, durationWeeks: 12,
    nextTestAt: "2026-10-23T09:00:00-03:00", reviewOn: "2026-11-13",
    adherence: james ? { done: 11, scheduled: 12 } : { done: Math.round((p.adherence ?? 0.8) * 12), scheduled: 12 },
  });
}

export const eventsFixture: ChartEvent[] = [
  { id: "ev-1", patientId: "p-001", date: "2026-09-15", type: "medication", detail: "New inhaler" },
  { id: "ev-2", patientId: "p-001", date: "2026-09-22", type: "spirometry", detail: "" },
  { id: "ev-3", patientId: "p-001", date: "2026-10-02", type: "doctor_note", detail: "" },
  { id: "ev-4", patientId: "p-001", date: "2026-10-09", type: "exacerbation", detail: "" },
];

export const notesFixture: Note[] = [
  { id: "n-1", patientId: "p-001", author: "Dr. Elena Morales", at: "2026-10-16T09:05:00-03:00", text: "New voice risk elevation. Review symptoms and arrange spirometry if clinically indicated." },
  { id: "n-2", patientId: "p-001", author: "Dr. Elena Morales", at: "2026-10-02T14:20:00-03:00", text: "No reported change in exercise tolerance. Inhaler technique reviewed." },
  { id: "n-3", patientId: "p-001", author: "Dr. Elena Morales", at: "2026-09-15T10:15:00-03:00", text: "Started tiotropium. Discussed monitoring schedule and consent." },
];

export const alertsSeed: Alert[] = [
  { id: "a-1", patientId: "p-001", patientName: "James Wilson", severity: "high", rule: "risk_rise", params: { points: 18, weeks: 2 }, resultId: "r-p-001-12", state: "open", firedAt: "2026-10-16T08:42:00-03:00" },
  { id: "a-2", patientId: "p-001", patientName: "James Wilson", severity: "moderate", rule: "sustained_deviation", params: { results: 3 }, resultId: "r-p-001-12", state: "open", firedAt: "2026-10-16T08:42:00-03:00" },
];
