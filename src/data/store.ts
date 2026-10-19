import type { Alert, ChartEvent, ClinicalReview, Note } from "./schemas";
import { alertsSeed, eventsFixture, notesFixture } from "./fixtures/profile";

export type AuditEvent = { id: string; at: string; actor: string; action: string; subject: string; detail?: string };

type Store = { reviews: Map<string, ClinicalReview>; notes: Note[]; events: ChartEvent[]; alerts: Alert[]; audit: AuditEvent[]; counter: number };

// Survives hot reloads in dev. Replace with Postgres/Prisma behind the same functions.
const g = globalThis as unknown as { __spiroStore?: Store };
export const store: Store = (g.__spiroStore ??= { reviews: new Map(), notes: [...notesFixture], events: [...eventsFixture], alerts: [...alertsSeed], audit: [], counter: 100 });

export const nextId = (prefix: string) => `${prefix}-${++store.counter}`;

/** Every read of audio, results and exports is logged. */
export function recordAudit(e: Omit<AuditEvent, "id" | "at" | "actor"> & { actor?: string; at?: string }) {
  store.audit.unshift({ id: nextId("au"), at: e.at ?? new Date().toISOString(), actor: e.actor ?? "c-001", action: e.action, subject: e.subject, detail: e.detail });
  store.audit.length = Math.min(store.audit.length, 500);
}
