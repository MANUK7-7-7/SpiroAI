import { CENTRES } from "./triage";

export { AGENT_SESSION } from "@/lib/session";

/** The demo health agent (agente sanitario). Fictional. */
export const AGENT = { name: "Laura Gómez", centre: CENTRES[0], area: "Villa Norte", doctor: "Dr. Elena Morales" } as const;

/** Today's home visits for the demo. Fictional people; the triage starts with these details filled in. */
export const AGENT_VISITS = [
  { id: "v-1", name: "Rosa Martínez", age: 64, sex: "f", address: "Pasaje 12, casa 3", reason: "due" },
  { id: "v-2", name: "Jorge Paz", age: 58, sex: "m", address: "Calle 5 n° 140", reason: "retriage" },
  { id: "v-3", name: "Ana Luna", age: 71, sex: "f", address: "Pasaje 9, casa 1", reason: "due" },
] as const;

export type AgentVisit = (typeof AGENT_VISITS)[number];
