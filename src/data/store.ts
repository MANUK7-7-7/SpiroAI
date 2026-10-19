import { defaultSettings } from "@/config/settings";
import type { Member, SettingsData } from "./settings-schemas";
import type { Alert, ChartEvent, ClinicalAction, Message, ClinicalReview, MonitoringPlan, Note, Patient } from "./schemas";
import { messagesSeed } from "./fixtures/messages";
import { alertsSeed, eventsFixture, notesFixture } from "./fixtures/profile";

export type AuditEvent = { id: string; at: string; actor: string; action: string; subject: string; detail?: string };

export type Invite = { token: string; patientId: string; createdAt: string; acceptedAt?: string };

type Store = { messages: Message[]; actions: ClinicalAction[]; plans: Map<string, MonitoringPlan>; patients: Patient[]; invites: Map<string, Invite>; reviews: Map<string, ClinicalReview>; notes: Note[]; events: ChartEvent[]; alerts: Alert[]; audit: AuditEvent[]; settings: SettingsData; members: Member[]; counter: number };

function membersSeed(): Member[] {
  return [
    { id: "m-1", name: "Dr. Elena Morales", email: "elena.morales@riverside.example", role: "owner" },
    { id: "m-2", name: "Dr. Luis Romero", email: "luis.romero@riverside.example", role: "doctor" },
    { id: "m-3", name: "Julia Costa", email: "julia.costa@riverside.example", role: "admin" },
    { id: "m-4", name: "Nina Park", email: "nina.park@riverside.example", role: "nurse", pending: true },
  ];
}

// Survives hot reloads in dev. Replace with Postgres/Prisma behind the same functions.
const g = globalThis as unknown as { __spiroStore?: Store };
export const store: Store = (g.__spiroStore ??= { messages: [...messagesSeed], actions: [], plans: new Map(), patients: [], invites: new Map(), reviews: new Map(), notes: [...notesFixture], events: [...eventsFixture], alerts: [...alertsSeed], audit: [], settings: structuredClone(defaultSettings) as unknown as SettingsData, members: membersSeed(), counter: 100 });

// Older hot-reloaded stores may lack newer collections.
store.patients ??= [];
store.invites ??= new Map();
store.actions ??= [];
store.messages ??= [...messagesSeed];
store.plans ??= new Map();
store.settings ??= structuredClone(defaultSettings) as unknown as SettingsData;
store.members ??= membersSeed();

export const nextId = (prefix: string) => `${prefix}-${++store.counter}`;

/** Every read of audio, results and exports is logged. */
export function recordAudit(e: Omit<AuditEvent, "id" | "at" | "actor"> & { actor?: string; at?: string }) {
  store.audit.unshift({ id: nextId("au"), at: e.at ?? new Date().toISOString(), actor: e.actor ?? "c-001", action: e.action, subject: e.subject, detail: e.detail });
  store.audit.length = Math.min(store.audit.length, 500);
}
