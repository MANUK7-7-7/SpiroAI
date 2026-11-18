import { describe, expect, it } from "vitest";
import { createTriage, getTriage } from "@/data/repositories/triage";
import { store } from "@/data/store";

const answers = { sex: "m", age: 60, packYears: 30, dyspnea: true, phlegm: false, cough: true, priorSpirometry: false } as const;
const newTriage = () => createTriage({ name: "Test Person", centre: "CAPS 3 · Centro", answers, consent: true }, "c-1");

describe("triage ids", () => {
  it("gives a new triage an id no other triage uses", () => {
    const seedIds = store.triages.map((t) => t.id);
    const t = newTriage();
    expect(seedIds).not.toContain(t.id);
    expect(store.triages.filter((x) => x.id === t.id)).toHaveLength(1);
    // The seed triages stay reachable.
    for (const id of seedIds.slice(0, 5)) expect(getTriage(id)?.id).toBe(id);
  });

  it("stays unique when the store already holds triages with higher ids (e.g. loaded from Redis)", () => {
    store.triages.unshift({ ...store.triages[0], id: "tr-950" });
    const ids = [newTriage().id, newTriage().id];
    expect(ids).toEqual(["tr-951", "tr-952"]);
    expect(new Set(store.triages.map((t) => t.id)).size).toBe(store.triages.length);
  });
});
