import { aiErrorBodySchema, modelInputSchema, modelOutputSchema, type ModelInput, type ModelOutput } from "../contracts";
import { AiError } from "../errors";
import type { ScreeningModelProvider } from "../provider";

type Options = { endpoint: string; apiKey?: string; timeoutMs: number; modelVersionPin?: string; fetchImpl?: typeof fetch };

/** Calls the external inference service (see services/inference/openapi.json). */
export class HttpProvider implements ScreeningModelProvider {
  readonly id = "http";
  readonly isDemo = false;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: Options) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async infer(input: ModelInput, { signal }: { signal?: AbortSignal } = {}): Promise<ModelOutput> {
    const parsed = modelInputSchema.safeParse(input);
    if (!parsed.success) throw new AiError("INVALID_INPUT", parsed.error.message);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.opts.timeoutMs);
    signal?.addEventListener("abort", () => ctrl.abort());
    try {
      const res = await this.fetchImpl(`${this.opts.endpoint.replace(/\/$/, "")}/v1/screen`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.opts.apiKey ? { authorization: `Bearer ${this.opts.apiKey}` } : {}),
          ...(this.opts.modelVersionPin ? { "x-model-version": this.opts.modelVersionPin } : {}),
        },
        body: JSON.stringify(parsed.data),
        signal: ctrl.signal,
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const err = aiErrorBodySchema.safeParse((body as { error?: unknown } | null)?.error ?? body);
        if (err.success) throw new AiError(err.data.code, err.data.message, err.data.reasons);
        throw new AiError(res.status >= 500 ? "MODEL_UNAVAILABLE" : "INVALID_INPUT", `Inference service responded ${res.status}`);
      }
      const out = modelOutputSchema.safeParse(body);
      if (!out.success) throw new AiError("MODEL_UNAVAILABLE", "Inference service returned an invalid response");
      return out.data;
    } catch (e) {
      if (e instanceof AiError) throw e;
      if ((e as Error).name === "AbortError") throw new AiError("TIMEOUT", `No response within ${this.opts.timeoutMs} ms`);
      throw new AiError("MODEL_UNAVAILABLE", (e as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }
}
