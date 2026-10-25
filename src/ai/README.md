# AI integration slot

The app talks to a screening model through one narrow interface. Plugging in the real model touches
**this folder and the environment**, never the UI.

```
contracts.ts        Zod schemas + types for model input/output (single source of truth)
provider.ts         ScreeningModelProvider interface
registry.ts         resolves the provider from config (AI_PROVIDER, AI_ENABLED)
providers/mock.ts   deterministic DEMO model, always labelled "Demo model" in the UI
providers/http.ts   calls the inference service over REST
quality/gate.ts     recording quality checks that run BEFORE inference
features/extractor  interface for acoustic feature extraction
pipeline.ts         gate -> infer -> post-process -> persist -> alert rules
postprocess.ts      risk band, baseline deviations, alert rules
result.ts           ScreeningResult: the only shape the UI reads
```

## Plug in the real model, step by step

1. The service described in `services/inference/openapi.json` (`POST /v1/screen`) lives in
   `services/inference/app.py`, with a voice model and a cough model. See its README and `models/MODEL_CARD.md`.
2. Keep the response matching `modelOutputSchema` in `contracts.ts`. If the model needs more input
   or returns more, change `contracts.ts` **and** `openapi.json` together. `npm test` runs a contract
   test that fails if they drift.
3. Set the environment:

   | Variable | Meaning |
   |---|---|
   | `AI_ENABLED` | `false` turns the AI off. The app still works as a monitoring and messaging tool. |
   | `AI_PROVIDER` | `mock` or `http`. Optional: `http` when `AI_ENDPOINT` is set, otherwise `mock` |
   | `AI_ENDPOINT` | base URL of the inference service |
   | `AI_API_KEY` | bearer token |
   | `AI_TIMEOUT_MS` | per-request timeout (default 60000) |
   | `AI_MODEL_VERSION_PIN` | optional exact version, sent as `x-model-version` |

4. Review the quality-gate thresholds (`quality/gate.ts`) and the risk-band thresholds
   (`src/config/risk-bands.ts`, configurable per institution in Settings). Both ship as **unvalidated samples**.
5. Done. No UI change is needed.

## Rules the code enforces

- **Async only.** Inference runs as a background job; the UI polls `ScreeningResult.status`.
- **Quality gate first.** A failing recording becomes `rejected_quality` and never reaches the model.
- **Every result stores its versions** (`modelId`, `modelVersion`, `extractorVersion`). Old results are never
  overwritten: re-scoring or retrying creates a new row.
- **Graceful degradation.** `MODEL_UNAVAILABLE` and `TIMEOUT` produce a `failed` result with a retry. A score is
  never invented or estimated.
- **Typed errors:** `QUALITY_REJECTED`, `MODEL_UNAVAILABLE`, `TIMEOUT`, `INVALID_INPUT`. Each maps to a designed UI state.
- **No patient identifiers** cross the boundary. Opaque recording IDs and short-lived signed URLs only.
- **Human in the loop.** Alerts only ask a clinician to look. Nothing here takes a clinical action.
- The mock provider is labelled "Demo model" wherever its results appear.
