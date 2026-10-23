import { describe, expect, it } from "vitest";
import { priorityFor, puma, pumaScore } from "@/config/triage";

describe("PUMA weighted score", () => {
  it("matches the published weights", () => {
    // Male, 63, 35 pack-years, breathless, phlegm, cough, no prior spirometry: 2 + 16 + 7 + 8 + 3 + 3 = 39
    expect(pumaScore({ sex: "m", age: 63, packYears: 35, dyspnea: true, phlegm: true, cough: true, priorSpirometry: false })).toBe(39);
    expect(pumaScore({ sex: "f", age: 45, packYears: 12, dyspnea: false, phlegm: false, cough: true, priorSpirometry: false })).toBe(3);
    expect(pumaScore({ sex: "m", age: 60, packYears: 31, dyspnea: true, phlegm: true, cough: true, priorSpirometry: true })).toBe(puma.max);
  });
});

describe("priority", () => {
  it("needs both signals for high, and falls back to the questionnaire without the voice", () => {
    expect(priorityFor(30, "high")).toBe("high");
    expect(priorityFor(30, "low")).toBe("medium");
    expect(priorityFor(10, "high")).toBe("medium");
    expect(priorityFor(10, "moderate")).toBe("low");
    expect(priorityFor(30, "off")).toBe("high");
    expect(priorityFor(10, "off")).toBe("low");
  });
});
