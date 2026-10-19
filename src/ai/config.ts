import { z } from "zod";

/**
 * AI configuration comes from the environment, never from code.
 *   AI_ENABLED            "false" turns the AI off; the app still works as a monitoring and messaging tool.
 *   AI_PROVIDER           mock | http
 *   AI_ENDPOINT           base URL of the inference service (http only)
 *   AI_API_KEY            bearer token for the inference service (http only)
 *   AI_TIMEOUT_MS         per-request timeout
 *   AI_MODEL_VERSION_PIN  optional exact model version to request
 */
const schema = z.object({
  AI_ENABLED: z.enum(["true", "false"]).default("true"),
  AI_PROVIDER: z.enum(["mock", "http"]).default("mock"),
  AI_ENDPOINT: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  AI_MODEL_VERSION_PIN: z.string().optional(),
});

export type AiConfig = { enabled: boolean; provider: "mock" | "http"; endpoint?: string; apiKey?: string; timeoutMs: number; modelVersionPin?: string };

export function loadAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const e = schema.parse(env);
  return { enabled: e.AI_ENABLED === "true", provider: e.AI_PROVIDER, endpoint: e.AI_ENDPOINT, apiKey: e.AI_API_KEY, timeoutMs: e.AI_TIMEOUT_MS, modelVersionPin: e.AI_MODEL_VERSION_PIN };
}
