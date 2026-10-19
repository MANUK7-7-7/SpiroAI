import { describe, expect, it } from "vitest";
import { bandFor, defaultRiskBands } from "@/config/risk-bands";
import { computeDeviations, changeVsBaseline, evaluateAlertRules } from "@/ai/postprocess";
import { baseline, features, result } from "./fixtures";

describe("risk bands", () => {
  it("maps the sample thresholds at the edges", () => {
    expect([0, 39].map((n) => bandFor(n))).toEqual(["low", "low"]);
    expect([40, 69].map((n) => bandFor(n))).toEqual(["moderate", "moderate"]);
    expect([70, 100].map((n) => bandFor(n))).toEqual(["high", "high"]);
  });
  it("respects institution-specific thresholds", () => {
    expect(bandFor(55, { moderateFrom: 30, highFrom: 50 })).toBe("high");
    expect(defaultRiskBands).toEqual({ moderateFrom: 40, highFrom: 70 });
  });
});

describe("baseline deviations", () => {
  it("is within when close to the personal baseline", () => {
    expect(computeDeviations(features, baseline).every((d) => d.flag === "within")).toBe(true);
  });
  it("flags only the unfavourable direction", () => {
    const d = computeDeviations({ ...features, jitterPct: 0.8, hnrDb: 25, mptSec: 11 }, baseline);
    const by = Object.fromEntries(d.map((x) => [x.metric, x.flag]));
    expect(by.jitter).toBe("deviation"); // +3 sd, higher is worse
    expect(by.hnr).toBe("within"); // higher HNR is not a deviation
    expect(by.mpt).toBe("deviation"); // -2.5 sd, lower is worse
  });
  it("reports unscored metrics without a baseline", () => {
    expect(computeDeviations(features).every((d) => d.flag === "within" && d.baseline === undefined)).toBe(true);
  });
  it("computes change against the baseline risk index", () => {
    expect(changeVsBaseline(23, baseline)).toBe(5);
    expect(changeVsBaseline(23)).toBeUndefined();
  });
});

describe("alert rules", () => {
  const now = "2026-10-16T09:00:00-03:00";
  it("raises risk_rise when the index climbs enough inside the window", () => {
    const history = [result({ id: "new", riskIndex: 72, band: "high", createdAt: "2026-10-16T08:00:00-03:00" }), result({ id: "old", riskIndex: 54, createdAt: "2026-10-04T08:00:00-03:00" })];
    expect(evaluateAlertRules(history, now)).toContainEqual({ rule: "risk_rise", points: 18, weeks: 2, severity: "high" });
  });
  it("ignores a rise outside the window or below the minimum", () => {
    expect(evaluateAlertRules([result({ riskIndex: 40, createdAt: "2026-10-16T08:00:00-03:00" }), result({ id: "o", riskIndex: 30, createdAt: "2026-10-14T08:00:00-03:00" })], now).find((a) => a.rule === "risk_rise")).toBeUndefined();
  });
  it("raises sustained_deviation after K consecutive deviating results", () => {
    const dev = [{ metric: "jitter" as const, value: 1, flag: "deviation" as const }];
    const h = [1, 2, 3].map((i) => result({ id: `r${i}`, deviations: dev, createdAt: `2026-10-1${i}T08:00:00-03:00` }));
    expect(evaluateAlertRules(h.reverse(), now).some((a) => a.rule === "sustained_deviation")).toBe(true);
  });
  it("raises missed_tests when the schedule is skipped", () => {
    const h = [result({ createdAt: "2026-09-25T08:00:00-03:00" })];
    expect(evaluateAlertRules(h, now).find((a) => a.rule === "missed_tests")).toMatchObject({ count: 2 });
  });
  it("raises poor_quality for an unbroken run of bad recordings", () => {
    const bad = (i: number) => result({ id: `b${i}`, status: "rejected_quality", riskIndex: undefined, createdAt: `2026-10-1${i}T08:00:00-03:00` });
    expect(evaluateAlertRules([bad(5), bad(4), bad(3)], now).find((a) => a.rule === "poor_quality")).toMatchObject({ count: 3 });
    expect(evaluateAlertRules([bad(5), result({ id: "ok" }), bad(3), bad(2)], now).find((a) => a.rule === "poor_quality")).toBeUndefined();
  });
});
