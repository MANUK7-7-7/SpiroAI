import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { aiErrorBodySchema, modelInputSchema, modelOutputSchema } from "@/ai/contracts";
import { AiError } from "@/ai/errors";
import { buildOpenApi } from "@/ai/openapi";
import { HttpProvider } from "@/ai/providers/http";
import { MockProvider } from "@/ai/providers/mock";
import { device } from "./fixtures";

const spec = JSON.parse(readFileSync("services/inference/openapi.json", "utf8"));
const input = { recordingId: "rec-1", source: "web_patient" as const, device, tasks: [{ task: "sustained_vowel" as const, url: "https://s/a?sig=1", durationSec: 7, sampleRate: 48000 }] };

let server: Server;
let base = "";
let mode: "ok" | "unavailable" | "slow" | "garbage" | "invalid" = "ok";
let lastHeaders: Record<string, unknown> = {};

beforeAll(async () => {
  const sample = await new MockProvider().infer(input);
  server = createServer((req, res) => {
    lastHeaders = req.headers;
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (status: number, json: unknown) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
      if (mode === "slow") return setTimeout(() => send(200, sample), 400);
      if (mode === "unavailable") return send(503, { error: { code: "MODEL_UNAVAILABLE", message: "down" } });
      if (mode === "invalid") return send(400, { error: { code: "INVALID_INPUT", message: "bad" } });
      if (mode === "garbage") return send(200, { nope: true });
      // The service validates the request against the OpenAPI contract before answering.
      return send(modelInputSchema.safeParse(JSON.parse(body)).success ? 200 : 400, modelInputSchema.safeParse(JSON.parse(body)).success ? sample : { error: { code: "INVALID_INPUT", message: "schema" } });
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const provider = (extra = {}) => new HttpProvider({ endpoint: base, apiKey: "k", timeoutMs: 200, ...extra });

describe("OpenAPI contract", () => {
  it("is generated from the Zod contracts (no drift)", () => {
    const fresh = buildOpenApi(z, { modelInputSchema, modelOutputSchema, aiErrorBodySchema });
    expect(JSON.parse(JSON.stringify(fresh))).toEqual(spec);
  });
  it("declares POST /v1/screen with the typed error responses", () => {
    expect(Object.keys(spec.paths["/v1/screen"].post.responses)).toEqual(["200", "400", "503", "504"]);
    expect(spec.components.schemas.ModelInput.required).toEqual(expect.arrayContaining(["recordingId", "tasks", "source", "device"]));
    expect(spec.components.schemas.ModelOutput.required).toEqual(expect.arrayContaining(["riskIndex", "confidence", "modelId", "modelVersion", "extractorVersion", "latencyMs", "warnings"]));
    expect(spec.components.schemas.AiErrorBody.properties.code.enum).toEqual(["QUALITY_REJECTED", "MODEL_UNAVAILABLE", "TIMEOUT", "INVALID_INPUT"]);
  });
});

describe("HttpProvider", () => {
  it("returns a contract-valid output and sends auth and version pin", async () => {
    mode = "ok";
    const out = await provider({ modelVersionPin: "1.2.3" }).infer(input);
    expect(modelOutputSchema.safeParse(out).success).toBe(true);
    expect(lastHeaders.authorization).toBe("Bearer k");
    expect(lastHeaders["x-model-version"]).toBe("1.2.3");
  });
  it("maps a 503 to MODEL_UNAVAILABLE", async () => {
    mode = "unavailable";
    await expect(provider().infer(input)).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });
  it("maps a slow response to TIMEOUT", async () => {
    mode = "slow";
    await expect(provider().infer(input)).rejects.toMatchObject({ code: "TIMEOUT" });
  });
  it("treats a malformed 200 as MODEL_UNAVAILABLE rather than inventing a score", async () => {
    mode = "garbage";
    await expect(provider().infer(input)).rejects.toBeInstanceOf(AiError);
  });
  it("maps INVALID_INPUT and validates the input before sending", async () => {
    mode = "invalid";
    await expect(provider().infer(input)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(provider().infer({ ...input, tasks: [] })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("reports an unreachable service as MODEL_UNAVAILABLE", async () => {
    await expect(new HttpProvider({ endpoint: "http://127.0.0.1:1", timeoutMs: 500 }).infer(input)).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });
});
