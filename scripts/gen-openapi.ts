import { writeFileSync } from "node:fs";
import { z } from "zod";
import { aiErrorBodySchema, modelInputSchema, modelOutputSchema } from "../src/ai/contracts";
import { buildOpenApi } from "../src/ai/openapi";

writeFileSync("services/inference/openapi.json", JSON.stringify(buildOpenApi(z, { modelInputSchema, modelOutputSchema, aiErrorBodySchema }), null, 2) + "\n");
console.log("services/inference/openapi.json written");
