import { z } from "zod";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
export const settingsSchemas = {
  profile: z.object({ fullName: z.string().trim().min(2), specialty: z.string().trim().min(2), email: z.string().email(), institution: z.string().trim().min(2), country: z.string().trim().min(2), city: z.string().trim().min(2), license: z.string() }),
  notifications: z.object({ push: z.boolean(), email: z.boolean(), severities: z.object({ high: z.boolean(), moderate: z.boolean(), low: z.boolean() }), quiet: z.boolean(), quietFrom: hhmm, quietTo: hhmm, daily: z.boolean(), dailyAt: hhmm }),
  thresholds: z.object({
    moderateFrom: z.number().int().min(1).max(98), highFrom: z.number().int().min(2).max(99),
    sustainedPts: z.number().int().min(1).max(50), sustainedTests: z.number().int().min(1).max(10),
    rapidPts: z.number().int().min(1).max(50), rapidDays: z.number().int().min(1).max(60),
    missedTests: z.number().int().min(1).max(10), poorCount: z.number().int().min(1).max(10), poorDays: z.number().int().min(1).max(60),
  }).refine((v) => v.moderateFrom < v.highFrom, { path: ["moderateFrom"], message: "ORDER" }),
  team: z.object({ shared: z.boolean() }),
  security: z.object({ idleMinutes: z.number().int().refine((n) => [5, 10, 15, 30].includes(n)) }),
  help: z.object({ tips: z.boolean() }),
} as const;

export type SettingsSection = keyof typeof settingsSchemas;
export type SettingsData = { [K in SettingsSection]: z.infer<(typeof settingsSchemas)[K]> };
export const sections = Object.keys(settingsSchemas) as SettingsSection[];

export const memberRoleSchema = z.enum(["doctor", "nurse", "admin"]);
export type Member = { id: string; name: string; email: string; role: "owner" | z.infer<typeof memberRoleSchema>; pending?: boolean };
