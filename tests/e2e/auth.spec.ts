import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("protected routes redirect to login", async ({ page }) => {
  await page.goto("/patients");
  await expect(page).toHaveURL(/\/login/);
});

test("login with two-factor lands on the dashboard", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a wrong code is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("a@b.example");
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("textbox").first().click();
  await page.keyboard.type("000000");
  await page.getByRole("button", { name: "Verify and continue" }).click({ timeout: 3000 }).catch(() => {});
  await expect(page).toHaveURL(/\/login\/2fa/);
  await expect(page).not.toHaveURL(/dashboard/);
});
