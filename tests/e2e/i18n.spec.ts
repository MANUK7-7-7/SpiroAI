import { expect, test } from "@playwright/test";

test("welcome page switches between Spanish and English", async ({ page, context }) => {
  await context.addCookies([{ name: "spiro_locale", value: "es", url: "http://localhost:3100" }]);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Iniciar sesión" }).or(page.getByRole("link", { name: "Iniciar sesión" }))).toBeVisible();
  await context.addCookies([{ name: "spiro_locale", value: "en", url: "http://localhost:3100" }]);
  await page.reload();
  await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible();
});
