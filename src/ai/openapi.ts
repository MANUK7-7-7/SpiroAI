import type { z as Z } from "zod";

type Schemas = { modelInputSchema: Z.ZodType; modelOutputSchema: Z.ZodType; aiErrorBodySchema: Z.ZodType };

/** Builds the OpenAPI document for the inference service directly from the Zod contracts, so they cannot drift. */
export function buildOpenApi(z: typeof Z, s: Schemas) {
  const js = (schema: Z.ZodType) => z.toJSONSchema(schema, { target: "draft-2020-12" });
  const err = { description: "Typed failure", content: { "application/json": { schema: { $ref: "#/components/schemas/AiErrorBody" } } } };
  return {
    openapi: "3.1.0",
    info: { title: "SpiroAI inference service", version: "1.0.0", description: "Screening support, not a diagnosis. Placeholder contract for the voice COPD risk model." },
    paths: {
      "/v1/screen": {
        post: {
          operationId: "screen",
          summary: "Score a recording",
          security: [{ bearer: [] }],
          parameters: [{ name: "x-model-version", in: "header", required: false, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ModelInput" } } } },
          responses: {
            "200": { description: "Scored", content: { "application/json": { schema: { $ref: "#/components/schemas/ModelOutput" } } } },
            "400": { ...err, description: "INVALID_INPUT or QUALITY_REJECTED" },
            "503": { ...err, description: "MODEL_UNAVAILABLE" },
            "504": { ...err, description: "TIMEOUT" },
          },
        },
      },
      "/healthz": { get: { operationId: "health", responses: { "200": { description: "ok" } } } },
    },
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      schemas: { ModelInput: js(s.modelInputSchema), ModelOutput: js(s.modelOutputSchema), AiErrorBody: js(s.aiErrorBodySchema) },
    },
  };
}
