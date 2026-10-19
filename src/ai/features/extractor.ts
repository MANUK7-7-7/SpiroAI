import type { AudioTaskInput, Features } from "../contracts";

/**
 * Acoustic feature extraction. In production this lives in the Python service next to the model;
 * this interface exists so a local extractor (e.g. WASM) can be swapped in without touching callers.
 */
export interface FeatureExtractor {
  readonly version: string;
  extract(tasks: AudioTaskInput[]): Promise<Features>;
}
