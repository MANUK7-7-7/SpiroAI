import type { RiskBand } from "@/config/risk-bands";
import { DEMO_NOW } from "@/config/demo";
import { DemoError, simulateLatency, type DemoState } from "../demo-state";
import { patientsFixture } from "../fixtures/patients";
import type { Patient } from "../schemas";

export type PatientQuery = {
  q?: string;
  risk?: RiskBand;
  status?: "diagnosed" | "at_risk";
  gold?: number;
  last?: "7d" | "30d";
  invite?: boolean;
  filter?: "review" | "overdue";
  sort?: "risk" | "last" | "name" | "adherence";
  page?: number;
  pageSize?: number;
};

export type PatientPage = { items: Patient[]; total: number; page: number; pageSize: number; counts: { active: number; invitesPending: number } };

const sorters: Record<NonNullable<PatientQuery["sort"]>, (a: Patient, b: Patient) => number> = {
  // The priority queue (featured patients) leads; within that, risk descending.
  risk: (a, b) => (a.featured ?? 999) - (b.featured ?? 999) || (b.latest?.riskIndex ?? -1) - (a.latest?.riskIndex ?? -1),
  last: (a, b) => (b.latest ? Date.parse(b.latest.at) : 0) - (a.latest ? Date.parse(a.latest.at) : 0),
  name: (a, b) => a.name.localeCompare(b.name, "es"),
  adherence: (a, b) => (a.adherence ?? -1) - (b.adherence ?? -1),
};

export async function listPatients(query: PatientQuery = {}, demo?: DemoState): Promise<PatientPage> {
  await simulateLatency();
  if (demo === "error") throw new DemoError();
  const pageSize = query.pageSize ?? 6;
  const counts = { active: patientsFixture.filter((p) => !p.invitePending).length, invitesPending: patientsFixture.filter((p) => p.invitePending).length };
  if (demo === "empty") return { items: [], total: 0, page: 1, pageSize, counts };

  const now = Date.parse(DEMO_NOW);
  const needle = query.q?.trim().toLowerCase();
  let items = patientsFixture.filter((p) => {
    if (needle && !(p.name.toLowerCase().includes(needle) || p.code.toLowerCase().includes(needle))) return false;
    if (query.risk && p.latest?.band !== query.risk) return false;
    if (query.status && p.status !== query.status) return false;
    if (query.gold && p.gold !== query.gold) return false;
    if (query.invite && !p.invitePending) return false;
    if (query.filter === "review" && p.latest?.judgment !== "pending") return false;
    if (query.filter === "overdue" && !(p.adherence !== undefined && p.adherence < 0.7)) return false;
    if (query.last) {
      const days = query.last === "7d" ? 7 : 30;
      if (!p.latest || now - Date.parse(p.latest.at) > days * 86_400_000) return false;
    }
    return true;
  });
  items = [...items].sort(sorters[query.sort ?? "risk"]);
  const total = items.length;
  const page = Math.min(Math.max(query.page ?? 1, 1), Math.max(1, Math.ceil(total / pageSize)));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, counts };
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  await simulateLatency(150);
  return patientsFixture.find((p) => p.id === id);
}
