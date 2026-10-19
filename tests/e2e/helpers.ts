import { expect, type Page } from "@playwright/test";

/** Demo credentials: any email, 8+ character password, OTP 482916. */
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("elena.morales@riverside.example");
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/login\/2fa/);
  await page.getByRole("textbox").first().click();
  await page.keyboard.type("482916");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
