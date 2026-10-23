import { describe, expect, it } from "vitest";
import { TEST_LINK_TTL_DAYS } from "@/config/recording";
import { createTestLink, getInvite } from "@/data/repositories/recordings";
import { store } from "@/data/store";

const DAY = 86_400_000;

describe("test links sent on WhatsApp", () => {
  it("opens the recorder for the right patient", () => {
    const link = createTestLink("p-001", "c-1");
    if ("error" in link) throw new Error(link.error);
    expect(getInvite(link.token)?.patient.id).toBe("p-001");
    expect(store.invites.get(link.token)?.kind).toBe("test");
  });

  it("expires after the configured number of days", () => {
    const now = Date.now();
    const link = createTestLink("p-001", "c-1", now);
    if ("error" in link) throw new Error(link.error);
    expect(getInvite(link.token, now + (TEST_LINK_TTL_DAYS - 1) * DAY)).toBeDefined();
    expect(getInvite(link.token, now + (TEST_LINK_TTL_DAYS + 1) * DAY)).toBeUndefined();
  });

  it("stops working once a result was received", () => {
    const link = createTestLink("p-002", "c-1");
    if ("error" in link) throw new Error(link.error);
    store.invites.get(link.token)!.usedAt = new Date().toISOString();
    expect(getInvite(link.token)).toBeUndefined();
  });

  it("is refused for unknown patients and revoked consent", () => {
    expect(createTestLink("p-does-not-exist", "c-1")).toEqual({ error: "NOT_FOUND" });
    store.patientPatch.set("p-003", { consent: "revoked" });
    expect(createTestLink("p-003", "c-1")).toEqual({ error: "CONSENT_REVOKED" });
    store.patientPatch.delete("p-003");
  });
});

describe("result notifications", () => {
  it("close themselves when the doctor reviews the result", async () => {
    const { submitReview } = await import("@/data/repositories/results");
    store.alerts.unshift({ id: "a-test", code: "AL-999", patientId: "p-001", patientName: "James Wilson", severity: "info", rule: "result_received", params: {}, resultId: "r-test", state: "open", firedAt: new Date().toISOString() });
    await submitReview({ resultId: "r-test", judgment: "agree", note: "", outcome: "no_concern", shareDeidentifiedFeedback: false, clinicianId: "c-1", clinicianName: "E. Morales" });
    expect(store.alerts.find((a) => a.id === "a-test")).toMatchObject({ state: "resolved", resolution: "reviewed", resolvedBy: "E. Morales" });
  });
});
