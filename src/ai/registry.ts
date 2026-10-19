import { loadAiConfig, type AiConfig } from "./config";
import type { ScreeningModelProvider } from "./provider";
import { HttpProvider } from "./providers/http";
import { MockProvider } from "./providers/mock";

/**
 * Plugging in the real model touches this file's inputs only: set AI_PROVIDER=http plus
 * AI_ENDPOINT / AI_API_KEY. Returns null when the AI is feature-flagged off.
 */
export function resolveProvider(config: AiConfig = loadAiConfig()): ScreeningModelProvider | null {
  if (!config.enabled) return null;
  if (config.provider === "http") {
    if (!config.endpoint) throw new Error("AI_PROVIDER=http requires AI_ENDPOINT");
    return new HttpProvider({ endpoint: config.endpoint, apiKey: config.apiKey, timeoutMs: config.timeoutMs, modelVersionPin: config.modelVersionPin });
  }
  return new MockProvider();
}
