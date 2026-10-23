import { DEMO_NOW } from "@/config/demo";
import { monitoringProfiles } from "@/config/monitoring-profiles";
import { BOOK_BY_DEFAULT, OBSTRUCTION_RATIO, priorityFor, pumaScore, RETRIAGE_MONTHS, type PumaAnswers, type VoiceSignal } from "@/config/triage";
import { DemoError, simulateLatency, type DemoState } from "../demo-state";
import { CENTRES } from "../fixtures/triage";
import { monitoringPlanSchema, patientSchema, triageSchema, type Patient, type Triage } from "../schemas";
import { nextId, recordAudit, store } from "../store";
import { allPatients } from "./patients";

const DAY = 86_400_000;
// New entries follow the demo clock, so they sort after the fictional history and before the open slots.
const bootedAt = Date.now();
const nowIso = () => new Date(Date.parse(DEMO_NOW) + (Date.now() - bootedAt)).toISOString();

/** Voice signal for a triage: waits for the analysis, and falls back to the questionnaire alone when there is none. */
export function voiceOf(t: Triage): VoiceSignal | "processing" {
  if (!t.recordingId) return t.voice;
  const r = store.liveRecords.find((x) => x.result.recordingId === t.recordingId)?.result;
  if (!r) return "processing";
  if (r.status !== "ready" || !r.band) return "off";
  return r.band;
}

export type TriageView = Triage & { voiceState: VoiceSignal | "processing" };

function view(t: Triage): TriageView {
  const voiceState = voiceOf(t);
  if (voiceState !== "processing" && voiceState !== t.voice) {
    t.voice = voiceState;
    t.priority = priorityFor(t.pumaScore, voiceState);
  }
  return { ...t, voiceState };
}

export async function listTriages(demo?: DemoState) {
  await simulateLatency(150);
  if (demo === "error") throw new DemoError();
  return demo === "empty" ? [] : store.triages.map(view);
}

export const getTriage = (id: string) => { const t = store.triages.find((x) => x.id === id); return t && view(t); };

export type NewTriage = { name: string; phone?: string; centre: string; answers: PumaAnswers; consent: true };

/** The person is triaged in person: consent is given there, so the record starts active. */
export function createTriage(input: NewTriage, by: string): Triage {
  const n = store.triages.length + 2400;
  const patient: Patient = patientSchema.parse({
    id: `p-t${n}`, code: `SP-T${n}`, name: input.name.trim(), initials: input.name.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase(),
    age: input.answers.age, sex: input.answers.sex, status: "at_risk", smoker: "current", consent: "active", invitePending: false, phone: input.phone,
  });
  store.patients.unshift(patient);
  const score = pumaScore(input.answers);
  const t = triageSchema.parse({
    id: nextId("tr"), code: `TR-${n}`, patientId: patient.id, patientName: patient.name, centre: input.centre, by, at: nowIso(),
    answers: input.answers, pumaScore: score, voice: "off", priority: priorityFor(score, "off"), override: false, worsening: false, monitoringStarted: false,
  });
  store.triages.unshift(t);
  recordAudit({ action: "triage.created", subject: t.id, detail: `consent in person · ${input.centre}` });
  return t;
}

export function attachRecording(id: string, recordingId: string) {
  const t = store.triages.find((x) => x.id === id);
  if (!t) return undefined;
  t.recordingId = recordingId;
  recordAudit({ action: "triage.voice", subject: id, detail: recordingId });
  return view(t);
}

export const openSlots = () => store.slots.filter((s) => !s.taken && Date.parse(s.at) > Date.parse(DEMO_NOW));

/** Books the spirometry. A low priority can always be referred: it is counted as an override, never blocked. */
export function refer(id: string, slotId: string, opts: { worsening?: boolean }) {
  const t = store.triages.find((x) => x.id === id);
  const slot = store.slots.find((s) => s.id === slotId && !s.taken);
  if (!t || !slot || t.referral) return undefined;
  slot.taken = true;
  const v = view(t);
  t.override = !BOOK_BY_DEFAULT[v.priority];
  t.worsening = !!opts.worsening;
  t.retriageOn = undefined;
  t.referral = { slotId, at: slot.at, place: slot.place, bookedAt: nowIso() };
  recordAudit({ action: "triage.referred", subject: id, detail: `${slot.at}${t.override ? " · override" : ""}${t.worsening ? " · worsening" : ""}` });
  return view(t);
}

export function scheduleRetriage(id: string) {
  const t = store.triages.find((x) => x.id === id);
  if (!t || t.referral) return undefined;
  const p = view(t).priority;
  if (p === "high") return undefined;
  t.retriageOn = new Date(Date.parse(DEMO_NOW) + RETRIAGE_MONTHS[p] * 30 * DAY).toISOString().slice(0, 10);
  recordAudit({ action: "triage.retriage", subject: id, detail: t.retriageOn });
  return view(t);
}

/** Hospital view: appointments in date order, WITHOUT the triage priority, so the result is entered blind. */
export async function hospitalAppointments(demo?: DemoState) {
  await simulateLatency(150);
  if (demo === "error") throw new DemoError();
  if (demo === "empty") return [];
  return store.triages.filter((t) => t.referral).map((t) => ({ id: t.id, code: t.code, patientName: t.patientName, centre: t.centre, at: t.referral!.at, spirometry: t.spirometry }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function enterSpirometry(id: string, input: { status: "done"; ratio: number } | { status: "no_show" }, by: string) {
  const t = store.triages.find((x) => x.id === id);
  if (!t?.referral) return undefined;
  t.spirometry = input.status === "done"
    ? { status: "done", ratio: input.ratio, obstruction: input.ratio < OBSTRUCTION_RATIO, enteredBy: by, enteredAt: nowIso() }
    : { status: "no_show", enteredBy: by, enteredAt: nowIso() };
  recordAudit({ action: "spirometry.entered", subject: id, detail: input.status === "done" ? `FEV1/FVC ${input.ratio}` : "no show" });
  return t.spirometry;
}

/** A confirmed case moves into follow-up: the person becomes a monitored patient with a stable-COPD plan. */
export function startMonitoring(id: string) {
  const t = store.triages.find((x) => x.id === id);
  if (!t?.spirometry?.obstruction) return undefined;
  let p = allPatients().find((x) => x.id === t.patientId);
  if (!p) {
    p = patientSchema.parse({ id: t.patientId.replace(/^tp-/, "p-t"), code: `SP-${t.code.slice(3)}`, name: t.patientName, initials: t.patientName.split(" ").map((x) => x[0]).join("").slice(0, 2), age: t.answers.age, sex: t.answers.sex, status: "at_risk", smoker: "current", consent: "active", invitePending: false });
    store.patients.unshift(p);
    t.patientId = p.id;
  }
  store.patientPatch.set(p.id, { ...store.patientPatch.get(p.id), status: "diagnosed" });
  const d = monitoringProfiles.stable;
  store.plans.set(p.id, monitoringPlanSchema.parse({
    patientId: p.id, profile: "stable", frequency: d.frequency, time: "09:00", sensitivity: d.sensitivity, reminders: { push: false, email: false, sms: true },
    durationWeeks: d.durationWeeks, nextTestAt: new Date(Date.parse(DEMO_NOW) + 7 * DAY).toISOString(), reviewOn: new Date(Date.parse(DEMO_NOW) + d.durationWeeks * 7 * DAY).toISOString().slice(0, 10), adherence: { done: 0, scheduled: 0 },
  }));
  t.monitoringStarted = true;
  recordAudit({ action: "monitoring.started", subject: p.id, detail: `from ${t.code}` });
  return p.id;
}

/** What the payer buys: cases found per 100 spirometries, against the questionnaire alone, plus overrides and completion. */
export function accuracyReport() {
  const all = store.triages.map(view);
  const referred = all.filter((t) => t.referral);
  const due = referred.filter((t) => Date.parse(t.referral!.at) < Date.parse(DEMO_NOW));
  // Patient-reported results are kept but left out of accuracy figures.
  const measured = due.filter((t) => t.spirometry?.status === "done");
  // Accuracy counts only referrals the triage recommended; overrides are shown on their own.
  const recommended = measured.filter((t) => !t.override);
  const cases = recommended.filter((t) => t.spirometry!.obstruction);
  const overrides = referred.filter((t) => t.override);
  const overridesMeasured = overrides.filter((t) => t.spirometry?.status === "done");
  const per100 = (c: number, n: number) => (n ? Math.round((c / n) * 100) : 0);
  return {
    triages: all.length, referred: referred.length, due: due.length, measured: measured.length,
    noShow: due.filter((t) => t.spirometry?.status === "no_show").length,
    patientReported: due.filter((t) => t.spirometry?.status === "patient_reported").length,
    pending: due.filter((t) => !t.spirometry).length,
    recommendedMeasured: recommended.length, cases: cases.length, casesPer100: per100(cases.length, recommended.length),
    /** Reference, not measured here: expected cases per 100 spirometries with the weighted PUMA alone at 20% prevalence (report table). */
    pumaReferencePer100: 38,
    overrides: overrides.length, overridesMeasured: overridesMeasured.length, overrideCases: overridesMeasured.filter((t) => t.spirometry!.obstruction).length,
    completion: per100(measured.length, due.length),
    retriageDue: all.filter((t) => t.retriageOn).length,
    byCentre: CENTRES.map((c) => { const m = recommended.filter((t) => t.centre === c); return { centre: c, measured: m.length, cases: m.filter((t) => t.spirometry!.obstruction).length }; }),
  };
}
