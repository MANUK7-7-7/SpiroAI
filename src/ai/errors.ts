import type { AiErrorCode } from "./contracts";

/** Typed failure from the AI layer. Each code maps to a designed UI state. */
export class AiError extends Error {
  constructor(public readonly code: AiErrorCode, message: string, public readonly reasons: string[] = []) {
    super(message);
    this.name = "AiError";
  }
  /** Transient failures can be retried by the clinician; the others need a new recording. */
  get retryable() {
    return this.code === "MODEL_UNAVAILABLE" || this.code === "TIMEOUT";
  }
}
