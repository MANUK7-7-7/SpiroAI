import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("thresholds must be ordered and the unsaved-changes guard asks before leaving", async ({ page }) => {
  await login(page);
  await page.goto("/settings/thresholds");
  const high = page.getByLabel(/High · From/);
  await high.fill("30");
  await page.getByRole("button", { name: "Save default thresholds" }).click();
  await expect(page.getByText("The Moderate threshold must be lower than the High threshold.")).toBeVisible();
  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page.getByText("Leave without saving?")).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page).toHaveURL(/\/settings\/profile/);
});
