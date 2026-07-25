import { expect, test } from "@playwright/test";

test("/dashboard redireciona para login quando deslogado", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
});
