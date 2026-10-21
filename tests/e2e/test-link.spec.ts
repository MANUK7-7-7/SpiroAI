import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("doctor sends a test link, patient records from it, the result reaches the doctor", async ({ page, browser }) => {
  await login(page);
  await page.goto("/patients/p-002");
  await page.getByRole("button", { name: "Request test now" }).click();
  await page.getByRole("button", { name: "Create test link" }).click();
  const link = await page.getByLabel("Test link").inputValue();
  expect(link).toMatch(/\/r\/t-[a-z0-9]+$/);
  await expect(page.getByRole("button", { name: "Send on WhatsApp" })).toBeEnabled();

  // The patient opens the link on their own device: no clinician session.
  const patientCtx = await browser.newContext({ permissions: ["microphone"] });
  const patient = await patientCtx.newPage();
  await patient.goto(link);
  await patient.getByRole("button", { name: "Allow microphone" }).click();
  await patient.getByRole("button", { name: "Start check" }).click();
  await expect(patient.getByText("Microphone check passed")).toBeVisible({ timeout: 10_000 });
  await patient.getByRole("button", { name: "Continue to recording" }).click();
  for (const secs of [7, 8, 4]) {
    await patient.getByRole("button", { name: "Start recording" }).click();
    await patient.waitForTimeout(secs * 1000);
    await patient.getByRole("button", { name: "Stop" }).click();
    await patient.getByRole("button", { name: /Next task|Send to my doctor/ }).click();
  }
  await expect(patient.getByRole("heading", { name: "Recording received" })).toBeVisible({ timeout: 30_000 });
  await expect(patient.getByText(/risk index/i)).toHaveCount(0);

  // The doctor is notified and opens the result from the alerts center.
  await expect(async () => {
    await page.goto("/alerts");
    await expect(page.locator("article").filter({ hasText: "Maria Chen" }).filter({ hasText: "New test result to review" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  // Other tests in the run may notify about other patients: pick this patient's alert.
  const alert = page.locator("article").filter({ hasText: "Maria Chen" }).filter({ hasText: "New test result to review" }).first();
  await alert.getByRole("link", { name: /Open result/ }).click();
  await expect(page).toHaveURL(/\/results\/r-p-002-/);
  await expect(page.getByText(/Screening support, not a diagnosis/).first()).toBeVisible();

  // It also waits in the review queue on the dashboard.
  await page.goto("/dashboard");
  await expect(page.getByText("New result sent by the patient").first()).toBeVisible();

  // The link worked once.
  await patient.goto(link);
  await expect(patient.getByText(/already been used/)).toBeVisible();
  await patientCtx.close();
});
