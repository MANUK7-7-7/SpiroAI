import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

async function micCheck(page: Page) {
  await page.getByRole("button", { name: "Allow microphone" }).click();
  await page.getByRole("button", { name: "Start check" }).click();
  await page.getByRole("button", { name: "Continue to recording" }).click({ timeout: 10_000 });
}

async function twoTasks(page: Page, last: RegExp) {
  for (const secs of [7, 27]) {
    await page.getByRole("button", { name: "Start recording" }).click();
    await page.waitForTimeout(secs * 1000);
    await page.getByRole("button", { name: "Stop" }).click();
    await page.getByRole("button", { name: /Next task|Send to my doctor|Send for analysis/ }).click();
  }
  void last;
}

test("invalid invitation link shows a designed error", async ({ page }) => {
  await page.goto("/r/not-a-real-token");
  await expect(page.getByText(/not valid/)).toBeVisible();
});

test("patient records two tasks on a computer, with voice processing off, and never sees a score", async ({ page }) => {
  await page.goto("/r/demo-invite");
  if (await page.getByRole("checkbox").isVisible()) {
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Consent is needed before recording.")).toBeVisible();
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await micCheck(page);
  await expect(page.getByText("Echo cancellation").locator("..")).toContainText("Off");
  await twoTasks(page, /./);
  await expect(page.getByRole("heading", { name: /Recording received|Please record again/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/risk index/i)).toHaveCount(0);
});

test("assisted recording creates a result the clinician can open", async ({ page }) => {
  await login(page);
  await page.goto("/patients/p-001/record");
  await micCheck(page);
  await twoTasks(page, /./);
  const open = page.getByRole("link", { name: "Open result" });
  await expect(open).toBeVisible({ timeout: 30_000 });
  await open.click();
  await expect(page.getByText(/Screening support, not a diagnosis/).first()).toBeVisible();
});
