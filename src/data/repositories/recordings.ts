import { randomUUID, timingSafeEqual } from "node:crypto";
import { AUDIO_TASKS, deviceMetaSchema, type AudioTaskId, type DeviceMeta } from "@/ai/contracts";
import { measureWav, parseWav, waveformOf } from "@/lib/wav";
import { nextId, recordAudit, store, type RecordingSession } from "../store";
import { patientsFixture } from "../fixtures/patients";
import { allPatients } from "./patients";
import { startScreening } from "./screening";
import { TEST_LINK_TTL_DAYS } from "@/config/recording";

export const MAX_TASK_BYTES = 12 * 1024 * 1024; // about 6 minutes of 16-bit mono 16 kHz PCM; larger uploads are refused
const TASKS: readonly AudioTaskId[] = AUDIO_TASKS;

/** The demo invite for the designed pending patient, so the patient link can be tried without creating a record. */
export const DEMO_INVITE = "demo-invite";

export function getInvite(token: string, now = Date.now()) {
  const stored = store.invites.get(token);
  if (stored && (stored.usedAt || (stored.expiresAt && Date.parse(stored.expiresAt) < now))) return undefined;
  const patient = stored
    ? allPatients().find((p) => p.id === stored.patientId)
    : token === DEMO_INVITE ? allPatients().find((p) => p.id === patientsFixture.find((x) => x.invitePending)?.id) : undefined;
  if (!patient) return undefined;
  const done = !!stored?.acceptedAt || patient.consent === "active";
  return { token, patient: { id: patient.id, code: patient.code, firstName: patient.name.split(" ")[0] }, consentGiven: done };
}

/** Consent is the patient's own act. Accepting activates the record and enables recording. */
export function acceptConsent(token: string) {
  const inv = getInvite(token);
  if (!inv) return undefined;
  const stored = store.invites.get(token);
  if (stored) stored.acceptedAt = new Date().toISOString();
  store.patientPatch.set(inv.patient.id, { consent: "active", invitePending: false });
  recordAudit({ action: "consent.granted", subject: inv.patient.id, actor: inv.patient.code, detail: "web invite" });
  return inv;
}

/**
 * A one-test link the doctor sends on WhatsApp. Earlier unused test links for the same patient stay
 * valid until they expire, so a message sent twice still works.
 */
export function createTestLink(patientId: string, clinicianId: string, now = Date.now()) {
  const patient = allPatients().find((p) => p.id === patientId);
  if (!patient) return { error: "NOT_FOUND" as const };
  if (patient.consent === "revoked") return { error: "CONSENT_REVOKED" as const };
  const token = `t-${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const expiresAt = new Date(now + TEST_LINK_TTL_DAYS * 86_400_000).toISOString();
  store.invites.set(token, { token, patientId, kind: "test", createdAt: new Date(now).toISOString(), expiresAt, sentBy: clinicianId });
  recordAudit({ action: "test_link.created", subject: patientId, actor: clinicianId, detail: `expires ${expiresAt}` });
  return { token, expiresAt, patient };
}

type Starter = { kind: "patient"; token: string } | { kind: "clinician"; clinicianId: string; patientId: string; consentConfirmed: boolean };

export function createSession(starter: Starter, device: unknown, micCheck: "passed" | "failed" | "skipped", protocol: "monitoring" | "triage" = "monitoring"): { id: string; secret: string } | { error: string } {
  const dev = deviceMetaSchema.safeParse(device);
  if (!dev.success) return { error: "INVALID_DEVICE" };
  let patientId: string;
  if (starter.kind === "patient") {
    const inv = getInvite(starter.token);
    if (!inv) return { error: "INVITE_NOT_FOUND" };
    if (!inv.consentGiven) return { error: "CONSENT_REQUIRED" };
    patientId = inv.patient.id;
  } else {
    const p = allPatients().find((x) => x.id === starter.patientId);
    if (!p) return { error: "NOT_FOUND" };
    if (p.consent === "revoked") return { error: "CONSENT_REVOKED" };
    if (p.consent !== "active" && !starter.consentConfirmed) return { error: "CONSENT_REQUIRED" };
    patientId = p.id;
  }
  const patient = allPatients().find((p) => p.id === patientId)!;
  const id = `rec-${patientId}-${nextId("w")}`;
  const s: RecordingSession = {
    id, patientId, patientCode: patient.code, source: starter.kind === "patient" ? "web_patient" : "web_assisted", secret: randomUUID(),
    startedBy: starter.kind === "patient" ? { role: "patient", id: patientId } : { role: "clinician", id: starter.clinicianId },
    device: dev.data as DeviceMeta, createdAt: new Date().toISOString(), status: "uploading", micCheck, protocol, takes: [], waveform: [], chunks: {}, completed: {},
    inviteToken: starter.kind === "patient" ? starter.token : undefined,
  };
  store.recordings.set(id, s);
  recordAudit({ action: "recording.started", subject: id, actor: starter.kind === "patient" ? patient.code : starter.clinicianId, detail: s.source });
  return { id, secret: s.secret };
}

export function authorize(id: string, secret: string | null, clinician: boolean) {
  const s = store.recordings.get(id);
  if (!s) return undefined;
  if (clinician) return s;
  const a = Buffer.from(secret ?? ""), b = Buffer.from(s.secret);
  return a.length === b.length && timingSafeEqual(a, b) ? s : undefined;
}

/** Chunks arrive in order. Re-sending an index replaces it, so an interrupted upload resumes from `received`. */
export function putChunk(s: RecordingSession, task: AudioTaskId, index: number, bytes: Buffer): { received: number } | { error: string } {
  if (s.status !== "uploading") return { error: "LOCKED" };
  const list = (s.chunks[task] ??= []);
  if (index < 0 || index > list.length) return { error: "OUT_OF_ORDER" };
  list[index] = bytes;
  list.length = index + 1;
  if (list.reduce((n, b) => n + b.length, 0) > MAX_TASK_BYTES) { delete s.chunks[task]; return { error: "TOO_LARGE" }; }
  return { received: list.length };
}

export const receivedChunks = (s: RecordingSession, task: AudioTaskId) => s.chunks[task]?.length ?? 0;

/** Measures the uploaded PCM on the server, then starts the screening job. The patient never sees a score. */
export function complete(s: RecordingSession): { ok: true } | { error: string } {
  if (s.status !== "uploading") return { error: "LOCKED" };
  const takes = [];
  let waveform: number[] = [];
  for (const task of TASKS) {
    const chunks = s.chunks[task];
    if (!chunks?.length) continue;
    try {
      const wav = parseWav(Buffer.concat(chunks));
      s.completed[task] = Buffer.concat(chunks);
      takes.push(measureWav(wav, task));
      if (task === "sustained_vowel") waveform = waveformOf(wav);
      s.device = { ...s.device, sampleRate: wav.sampleRate };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  if (!takes.length) return { error: "NO_AUDIO" };
  s.takes = takes;
  s.waveform = waveform.length ? waveform : Array(56).fill(0);
  s.chunks = {};
  recordAudit({ action: "recording.uploaded", subject: s.id, actor: s.startedBy.role === "patient" ? s.patientCode : s.startedBy.id, detail: `${takes.length} tasks` });
  startScreening(s.id);
  return { ok: true };
}

export const requiredTasks = TASKS;
