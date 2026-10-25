import { describe, expect, it } from "vitest";
import { loadAiConfig } from "@/ai/config";
import { resolveProvider } from "@/ai/registry";

describe("registry", () => {
  it("defaults to the labelled mock provider", () => {
    const p = resolveProvider(loadAiConfig({}));
    expect(p?.id).toBe("mock-demo");
    expect(p?.isDemo).toBe(true);
  });
  it("switches to http purely through config", () => {
    const p = resolveProvider(loadAiConfig({ AI_PROVIDER: "http", AI_ENDPOINT: "http://localhost:8000", AI_API_KEY: "k" }));
    expect(p?.id).toBe("http");
    expect(p?.isDemo).toBe(false);
  });
  it("connects the real models as soon as an endpoint is configured", () => {
    expect(resolveProvider(loadAiConfig({ AI_ENDPOINT: "http://localhost:8000" }))?.id).toBe("http");
    expect(resolveProvider(loadAiConfig({ AI_PROVIDER: "mock", AI_ENDPOINT: "http://localhost:8000" }))?.id).toBe("mock-demo");
  });
  it("requires an endpoint for http", () => {
    expect(() => resolveProvider(loadAiConfig({ AI_PROVIDER: "http" }))).toThrow(/AI_ENDPOINT/);
  });
  it("returns null when the feature flag is off", () => {
    expect(resolveProvider(loadAiConfig({ AI_ENABLED: "false" }))).toBeNull();
  });
});
