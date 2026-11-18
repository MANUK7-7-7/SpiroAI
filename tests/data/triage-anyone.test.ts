import { describe, expect, it } from "vitest";
import { pumaScore } from "@/config/triage";
import { createTriage } from "@/data/repositories/triage";
import { store } from "@/data/store";

describe("triage is open to anyone", () => {
  it("triages a young person who never smoked", () => {
    const answers = { sex: "f", age: 22, packYears: 0, dyspnea: true, phlegm: false, cough: true, priorSpirometry: false } as const;
    const t = createTriage({ name: "Young Person", centre: "CAPS 3 · Centro", smoking: "never", answers, consent: true }, "c-1");
    // Under 40 and no pack-years add no points: only the symptoms count.
    expect(t.pumaScore).toBe(pumaScore(answers));
    expect(t.pumaScore).toBe(11);
    expect(store.patients.find((p) => p.id === t.patientId)?.smoker).toBe("never");
  });
});
