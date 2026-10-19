import { bandFor, type RiskBands } from "@/config/risk-bands";
import { memberRoleSchema, settingsSchemas, type Member, type SettingsData, type SettingsSection } from "../settings-schemas";
import { simulateLatency, type DemoState, DemoError } from "../demo-state";
import { nextId, recordAudit, store } from "../store";

export const getSettings = (): SettingsData => store.settings;

/** Institution risk bands. Read by every place that turns a risk index into a band. */
export const getBands = (): RiskBands => ({ moderateFrom: store.settings.thresholds.moderateFrom, highFrom: store.settings.thresholds.highFrom });
export const bandOf = (riskIndex: number) => bandFor(riskIndex, getBands());

export async function saveSection<K extends SettingsSection>(section: K, value: unknown): Promise<SettingsData[K]> {
  const parsed = settingsSchemas[section].parse(value) as SettingsData[K];
  await simulateLatency(150);
  const before = store.settings[section];
  store.settings[section] = parsed;
  recordAudit({ action: "settings.update", subject: section, detail: section === "thresholds" ? `${JSON.stringify(before)} -> ${JSON.stringify(parsed)}` : undefined });
  return parsed;
}

export async function listMembers(demo?: DemoState): Promise<Member[]> {
  await simulateLatency(150);
  if (demo === "error") throw new DemoError();
  if (demo === "empty") return store.members.filter((m) => m.role === "owner");
  return store.members;
}

export function inviteMember(email: string, role: unknown): Member {
  const r = memberRoleSchema.parse(role);
  const m: Member = { id: nextId("m"), name: email.split("@")[0].replace(/[._]/g, " "), email, role: r, pending: true };
  store.members.push(m);
  recordAudit({ action: "team.invite", subject: email, detail: r });
  return m;
}

export function updateMember(id: string, op: "resend" | "cancel" | "remove") {
  const m = store.members.find((x) => x.id === id);
  if (!m || m.role === "owner") return undefined;
  if (op !== "resend") store.members = store.members.filter((x) => x.id !== id);
  recordAudit({ action: `team.${op}`, subject: m.email });
  return m;
}
