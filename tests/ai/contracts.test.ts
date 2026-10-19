import { describe, expect, it } from "vitest";
import { modelInputSchema, modelOutputSchema, aiErrorBodySchema } from "@/ai/contracts";
import { MockProvider } from "@/ai/providers/mock";
import { device } from "./fixtures";

const input = {
  recordingId: "rec-1", source: "web_patient", device,
  tasks: [{ task: "sustained_vowel", url: "https://storage.example/a?sig=1", durationSec: 7, sampleRate: 48000 }],
};

describe("contracts", () => {
  it("accepts a valid input and rejects missing fields", () => {
    expect(modelInputSchema.safeParse(input).success).toBe(true);
    expect(modelInputSchema.safeParse({ ...input, tasks: [] }).success).toBe(false);
    expect(modelInputSchema.safeParse({ ...input, source: "carrier_pigeon" }).success).toBe(false);
  });

  it("requires the processing flags that were actually applied", () => {
    const { processing: _p, ...rest } = device;
    expect(modelInputSchema.safeParse({ ...input, device: rest }).success).toBe(false);
  });

  it("rejects out-of-range scores and confidence", () => {
    const out = new MockProvider().infer(input as never);
    return out.then((o) => {
      expect(modelOutputSchema.safeParse(o).success).toBe(true);
      expect(modelOutputSchema.safeParse({ ...o, riskIndex: 101 }).success).toBe(false);
      expect(modelOutputSchema.safeParse({ ...o, confidence: 1.2 }).success).toBe(false);
      expect(modelOutputSchema.safeParse({ ...o, modelVersion: "" }).success).toBe(false);
    });
  });

  it("has the four typed error codes", () => {
    for (const code of ["QUALITY_REJECTED", "MODEL_UNAVAILABLE", "TIMEOUT", "INVALID_INPUT"]) expect(aiErrorBodySchema.safeParse({ code, message: "x" }).success).toBe(true);
    expect(aiErrorBodySchema.safeParse({ code: "OOPS", message: "x" }).success).toBe(false);
  });

  it("mock is deterministic and labelled as a demo", async () => {
    const p = new MockProvider();
    const a = await p.infer(input as never);
    const b = await p.infer(input as never);
    expect(a.riskIndex).toBe(b.riskIndex);
    expect(p.isDemo).toBe(true);
    expect(a.warnings).toContain("DEMO_MODEL_NOT_VALIDATED");
  });
});
