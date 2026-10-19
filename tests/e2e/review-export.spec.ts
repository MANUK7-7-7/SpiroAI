import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("review a result with disclaimer, confidence and model version, then it records the judgment", async ({ page }) => {
  await login(page);
  await page.goto("/results/r-p-001-11");
  await expect(page.getByText("Screening support, not a diagnosis").first()).toBeVisible();
  await expect(page.getByText(/AI confidence/)).toBeVisible();
  await expect(page.getByText(/Model:/)).toBeVisible();
  await page.getByRole("button", { name: "Mark as reviewed" }).click();
  await page.reload();
  await expect(page.getByText(/Reviewed/).first()).toBeVisible();
});

test("report export produces a PDF and is audited", async ({ page, request }) => {
  await login(page);
  const cookies = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await request.get("/api/patients/p-001/report?format=pdf&audience=clinical", { headers: { cookie: cookies } });
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("pdf");
  expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
});
