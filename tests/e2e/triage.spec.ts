import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("triage with consent, PUMA and voice, then booking and a blind hospital result", async ({ page }) => {
  await login(page);
  await page.goto("/triage/new");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Test Person");
  await page.getByLabel("Sex").selectOption("m");
  await page.getByLabel("Age", { exact: true }).fill("63");
  await page.getByLabel("Pack-years").fill("35");
  await page.getByRole("button", { name: "Continue" }).click();
  for (const i of [0, 1, 2]) await page.getByRole("button", { name: "Yes" }).nth(i).click();
  await page.getByRole("button", { name: "No" }).nth(3).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Allow microphone" }).click();
  await page.getByRole("button", { name: "Start check" }).click();
  await page.getByRole("button", { name: "Continue to recording" }).click({ timeout: 10_000 });
  for (const secs of [6, 8, 3]) {
    await page.getByRole("button", { name: "Start recording" }).click();
    await page.waitForTimeout(secs * 1000);
    await page.getByRole("button", { name: "Stop" }).click();
    await page.getByRole("button", { name: /Next task|Send for analysis/ }).click();
  }
  await expect(page).toHaveURL(/\/triage\/tr-/, { timeout: 30_000 });
  await expect(page.getByText("This is not a diagnosis.", { exact: false })).toBeVisible();
  await expect(page.getByText(/PUMA score 39 of 44/)).toBeVisible();
  await expect(page.getByText(/risk index/i)).toHaveCount(0);

  await page.goto("/hospital");
  await expect(page.getByText(/priority is hidden/i)).toBeVisible();
  await expect(page.getByText(/^High$|^Medium$|^Low$/)).toHaveCount(0);
});
