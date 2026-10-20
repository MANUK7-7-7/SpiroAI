// All patients are FICTIONAL. Deterministic generation keeps fixtures stable between renders.
import { bandFor } from "@/config/risk-bands";
import { patientSchema, type Patient } from "../schemas";

type Raw = Omit<Patient, "initials" | "latest"> & { latest?: Omit<NonNullable<Patient["latest"]>, "band" | "resultId"> };

const designed: Raw[] = [
  { id: "p-001", code: "SP-1042", name: "James Wilson", age: 67, sex: "m", status: "diagnosed", gold: 2, smoker: "former", consent: "active", invitePending: false, adherence: 0.92, featured: 1,
    latest: { riskIndex: 72, confidence: 0.92, quality: "good", judgment: "pending", at: "2026-10-16T08:42:00-03:00", trend: 18 } },
  { id: "p-002", code: "SP-1038", name: "Maria Chen", age: 59, sex: "f", status: "diagnosed", gold: 1, smoker: "never", consent: "active", invitePending: false, adherence: 0.86, featured: 2,
    latest: { riskIndex: 54, confidence: 0.9, quality: "good", judgment: "pending", at: "2026-10-16T07:15:00-03:00", trend: 9 } },
  { id: "p-003", code: "SP-1025", name: "Robert Davis", age: 71, sex: "m", status: "diagnosed", gold: 2, smoker: "former", consent: "active", invitePending: false, adherence: 0.64, featured: 3,
    latest: { riskIndex: 49, confidence: 0.88, quality: "good", judgment: "pending", at: "2026-10-14T09:05:00-03:00", trend: 1 } },
  { id: "p-004", code: "SP-1031", name: "Ana Garcia", age: 52, sex: "f", status: "at_risk", smoker: "current", consent: "active", invitePending: false, adherence: 0.96, featured: 4,
    latest: { riskIndex: 23, confidence: 0.94, quality: "good", judgment: "pending", at: "2026-10-15T10:20:00-03:00", trend: -4 } },
  { id: "p-005", code: "SP-1046", name: "David Brown", age: 63, sex: "m", status: "at_risk", smoker: "former", consent: "active", invitePending: false, adherence: 0.89, featured: 5,
    latest: { riskIndex: 19, confidence: 0.91, quality: "good", judgment: "pending", at: "2026-10-15T08:10:00-03:00", trend: 0 } },
  { id: "p-006", code: "SP-1049", name: "Paul Turner", age: 61, sex: "m", status: "at_risk", smoker: "current", consent: "pending", invitePending: true, featured: 6 },
  { id: "p-007", code: "SP-1051", name: "Sofia Patel", age: 48, sex: "f", status: "at_risk", smoker: "never", consent: "active", invitePending: false },
];

const first = ["Lucía", "Mateo", "Valentina", "Santiago", "Camila", "Joaquín", "Martina", "Tomás", "Julieta", "Facundo", "Florencia", "Nicolás", "Agustina", "Lautaro", "Emma", "Liam", "Olivia", "Noah", "Sara", "Ahmed", "Yuki", "Priya", "Marta", "Hugo", "Inés", "Bruno", "Elena", "Diego", "Carla", "Pablo"];
const last = ["González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Sánchez", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Acosta", "Benítez", "Silva", "Kim", "Nguyen", "Khan", "Rossi", "Müller", "Haddad", "Okafor", "Costa", "Ibarra", "Molina"];

let seed = 20261016;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

function generated(n: number): Raw[] {
  return Array.from({ length: n }, (_, i) => {
    const num = 1052 + i;
    const status = rnd() < 0.55 ? "diagnosed" : "at_risk";
    const invite = i % 21 === 5; // six more pending invites, 7 in total with the designed one
    const r = rnd();
    const riskIndex = Math.round(r < 0.64 ? 5 + rnd() * 33 : r < 0.92 ? 40 + rnd() * 28 : 70 + rnd() * 24);
    const day = 1 + Math.floor(rnd() * 14);
    const base: Raw = {
      id: `p-${String(100 + i)}`, code: `SP-${num}`, name: `${pick(first)} ${pick(last)}`, age: 38 + Math.floor(rnd() * 48), sex: rnd() < 0.5 ? "f" : "m",
      status, gold: status === "diagnosed" ? 1 + Math.floor(rnd() * 4) : undefined, smoker: pick(["never", "former", "current"] as const),
      consent: invite ? "pending" : "active", invitePending: invite,
    };
    if (invite) return base;
    return {
      ...base, adherence: Math.round((0.5 + rnd() * 0.5) * 100) / 100,
      latest: { riskIndex, confidence: Math.round((0.82 + rnd() * 0.15) * 100) / 100, quality: rnd() < 0.9 ? "good" : "fair", judgment: rnd() < 0.7 ? "pending" : "agreed", at: `2026-10-${String(day).padStart(2, "0")}T${String(8 + Math.floor(rnd() * 9)).padStart(2, "0")}:${String(Math.floor(rnd() * 60)).padStart(2, "0")}:00-03:00`, trend: Math.round(rnd() * 20 - 8) },
    };
  });
}

const initials = (name: string) => name.replace(/^Dra?\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// Argentine mobile numbers never start with 0 after the area code, so these cannot reach a real person.
const fictionalPhone = (i: number) => `+54 9 11 0${String(100 + i).padStart(3, "0")}-${String(4000 + i * 7).slice(-4)}`;

export const patientsFixture: Patient[] = [...designed, ...generated(128)].map((p, i) =>
  patientSchema.parse({ ...p, phone: fictionalPhone(i), initials: initials(p.name), latest: p.latest ? { ...p.latest, resultId: `r-${p.id}`, band: bandFor(p.latest.riskIndex) } : undefined }),
);
