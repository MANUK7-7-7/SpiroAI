import { describe, expect, it } from "vitest";
import { runScreening, type PipelineDeps, type RecordingRecord } from "@/ai/pipeline";
import { MockProvider } from "@/ai/providers/mock";
import { defaultAlertRules } from "@/ai/postprocess";
import { defaultRiskBands } from "@/config/risk-bands";
import type { ScreeningResult } from "@/ai/result";
import { baseline, device, goodTakes } from "./fixtures";

function setup(id: string, over: Partial<RecordingRecord> = {}, provider: PipelineDeps["provider"] = new MockProvider()) {
  const saved: ScreeningResult[] = [];
  const audit: string[] = [];
  const rec: RecordingRecord = { id, patientId: "p-1", source: "web_assisted", startedBy: { role: "clinician", id: "c-1" }, device, takes: goodTakes, signedUrls: async () => ({ sustained_vowel: "https://s/a", reading_passage: "https://s/b" }), ...over };
  const deps: PipelineDeps = {
    provider, getRecording: async () => rec, getBaseline: async () => baseline, history: async () => saved,
    saveResult: async (r) => { saved.push(r); }, raiseAlerts: async () => {}, audit: async (e) => { audit.push(e.action); },
    bands: defaultRiskBands, alertRules: defaultAlertRules, now: () => "2026-10-16T09:00:00-03:00",
  };
  return { deps, saved, audit };
}

describe("pipeline", () => {
  it("stores a ready result with versions, band and deviations", async () => {
    const { deps, saved } = setup("rec-ok");
    const r = await runScreening("rec-ok", deps);
    expect(r.status).toBe("ready");
    expect(r.modelId).toBe("mock-demo");
    expect(r.modelVersion).toBe("0.0.0-demo");
    expect(r.extractorVersion).toBeTruthy();
    expect(r.isDemoModel).toBe(true);
    expect(r.deviations).toHaveLength(5);
    expect(saved).toHaveLength(1);
  });

  it("never sends a failing recording to the model", async () => {
    let called = false;
    const spy: PipelineDeps["provider"] = { id: "spy", isDemo: false, infer: async () => { called = true; throw new Error("should not run"); } };
    const { deps } = setup("rec-bad", { takes: [{ ...goodTakes[0], durationSec: 1 }, goodTakes[1]] }, spy);
    const r = await runScreening("rec-bad", deps);
    expect(called).toBe(false);
    expect(r.status).toBe("rejected_quality");
    expect(r.error?.code).toBe("QUALITY_REJECTED");
    expect(r.riskIndex).toBeUndefined();
  });

  it("degrades gracefully: unavailable and timeout leave no score and are retryable", async () => {
    for (const [id, code] of [["rec__unavailable", "MODEL_UNAVAILABLE"], ["rec__timeout", "TIMEOUT"]] as const) {
      const { deps } = setup(id);
      const r = await runScreening(id, deps);
      expect(r.status).toBe("failed");
      expect(r.error).toMatchObject({ code, retryable: true });
      expect(r.riskIndex).toBeUndefined();
    }
  });

  it("with the AI flagged off the result stays pending and unavailable", async () => {
    const { deps } = setup("rec-off", {}, null);
    const r = await runScreening("rec-off", deps);
    expect(r).toMatchObject({ status: "pending", unavailable: true });
    expect(r.riskIndex).toBeUndefined();
  });

  it("a retry creates a new row linked to the failed one", async () => {
    const { deps, saved } = setup("rec__unavailable");
    const failed = await runScreening("rec__unavailable", deps);
    const retry = await runScreening("rec__unavailable", deps, { retryOf: failed.id });
    expect(saved).toHaveLength(2);
    expect(retry.id).not.toBe(failed.id);
    expect(retry.retryOf).toBe(failed.id);
  });

  it("sends no patient identifiers to the model", async () => {
    let seen: unknown;
    const spy: PipelineDeps["provider"] = { id: "spy", isDemo: false, infer: async (i) => { seen = i; return new MockProvider().infer(i); } };
    const { deps } = setup("rec-priv", {}, spy);
    await runScreening("rec-priv", deps);
    const json = JSON.stringify(seen);
    expect(json).not.toContain("p-1");
    expect(json).not.toContain("c-1");
  });
});
