/** Lets reviewers force the four designed states with ?state=loading|empty|error. */
export type DemoState = "loading" | "empty" | "error" | undefined;

export const parseDemoState = (value: string | string[] | undefined): DemoState => {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "loading" || v === "empty" || v === "error" ? v : undefined;
};

export const simulateLatency = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export class DemoError extends Error {
  constructor(message = "Simulated data error") {
    super(message);
    this.name = "DemoError";
  }
}
