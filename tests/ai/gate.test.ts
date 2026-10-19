import { describe, expect, it } from "vitest";
import { runQualityGate } from "@/ai/quality/gate";
import { device, goodTakes } from "./fixtures";

describe("quality gate", () => {
  it("passes a clean two-task recording", () => {
    expect(runQualityGate("web_patient", device, goodTakes)).toMatchObject({ pass: true, level: "good", reasons: [] });
  });
  it("rejects short, noisy, clipped and off-task takes with reasons", () => {
    const r = runQualityGate("web_patient", device, [{ ...goodTakes[0], durationSec: 2, noiseFloorDb: -20, clippedRatio: 0.05, voicedRatio: 0.1 }, goodTakes[1]]);
    expect(r.pass).toBe(false);
    expect(r.level).toBe("poor");
    expect(r.reasons).toEqual(expect.arrayContaining(["TOO_SHORT", "TOO_NOISY", "CLIPPING", "WRONG_TASK"]));
  });
  it("requires both tasks", () => {
    expect(runQualityGate("mobile_app", device, [goodTakes[0]]).reasons).toContain("MISSING_TASK");
  });
  it("applies thresholds per source", () => {
    const takes = goodTakes.map((t) => ({ ...t, noiseFloorDb: -41 }));
    expect(runQualityGate("mobile_app", device, takes).pass).toBe(false); // phone limit -45
    expect(runQualityGate("web_assisted", device, takes).pass).toBe(true); // clinic limit -40
  });
  it("downgrades to fair when the browser forced voice processing on", () => {
    const r = runQualityGate("web_patient", { ...device, processing: { ...device.processing, noiseSuppression: true } }, goodTakes);
    expect(r.pass).toBe(true);
    expect(r.level).toBe("fair");
    expect(r.warnings[0]).toContain("noiseSuppression");
  });
});
