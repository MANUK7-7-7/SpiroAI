import type { ModelInput, ModelOutput } from "./contracts";

/**
 * The only thing the rest of the app knows about a screening model.
 * Implementations throw AiError for the four typed failures and never return an estimated score.
 */
export interface ScreeningModelProvider {
  /** Stable identifier, e.g. "mock" or "spiro-voice-copd". */
  readonly id: string;
  /** True for providers that must be labelled "Demo model" in the UI. */
  readonly isDemo: boolean;
  infer(input: ModelInput, opts?: { signal?: AbortSignal }): Promise<ModelOutput>;
}
