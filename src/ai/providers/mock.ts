import { modelOutputSchema, type ModelInput, type ModelOutput } from "../contracts";
import { AiError } from "../errors";
import type { ScreeningModelProvider } from "../provider";

/**
 * DEMO MODEL. Deterministic, not trained, not validated. Scores are derived from a hash of the
 * recording ID so demos and tests are repeatable. The UI always labels results from this provider
 * "Demo model".
 */
export class MockProvider implements ScreeningModelProvider {
  readonly id = "mock-demo";
  readonly isDemo = true;
  static readonly version = "0.0.0-demo";

  async infer(input: ModelInput): Promise<ModelOutput> {
    const started = Date.now();
    // Test hook: recording IDs containing these markers exercise the typed error paths.
    if (input.recordingId.includes("__unavailable")) throw new AiError("MODEL_UNAVAILABLE", "Demo model unavailable");
    if (input.recordingId.includes("__timeout")) throw new AiError("TIMEOUT", "Demo model timed out");

    const h = hash(input.recordingId);
    const unit = (n: number) => ((h >>> n) % 1000) / 1000;
    const tasks = input.tasks.map((t) => t.task);
    const voice = tasks.includes("sustained_vowel") && tasks.includes("counting") ? h % 101 : undefined;
    const cough = tasks.includes("cough") ? Math.min(100, Math.max(0, (h % 101) + Math.round((unit(15) - 0.5) * 30))) : undefined;
    const parts = [voice, cough].filter((v): v is number => v !== undefined);
    const riskIndex = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : h % 101;
    const out: ModelOutput = {
      riskIndex,
      subScores: {
        voice: voice === undefined ? undefined : { riskIndex: voice, target: "chronic_lung_disease", tasks: ["sustained_vowel", "counting"] },
        cough: cough === undefined ? undefined : { riskIndex: cough, target: "copd", tasks: ["cough"] },
      },
      confidence: Math.round((0.8 + unit(3) * 0.17) * 100) / 100,
      quality: { level: "good", reasons: [] },
      features: {
        f0Hz: round(110 + unit(5) * 120, 1),
        jitterPct: round(0.3 + unit(7) * 1.4, 2),
        shimmerPct: round(2 + unit(9) * 5, 2),
        hnrDb: round(14 + unit(11) * 10, 1),
        mptSec: round(8 + unit(13) * 14, 1),
        mfcc: Array.from({ length: 13 }, (_, i) => round((unit(i + 1) - 0.5) * 40, 2)),
      },
      featureContributions: { jitter: round(unit(2) * 0.4, 2), shimmer: round(unit(4) * 0.3, 2), hnr: round(unit(6) * 0.2, 2), mpt: round(unit(8) * 0.1, 2) },
      modelId: this.id,
      modelVersion: MockProvider.version,
      extractorVersion: "mock-extractor-0.0.0",
      latencyMs: Date.now() - started,
      warnings: ["DEMO_MODEL_NOT_VALIDATED"],
    };
    return modelOutputSchema.parse(out);
  }
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
