import { expect, test } from "@playwright/test";

test("landing pública carrega com hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Seu arquivo no formato");
  await expect(page.getByAltText(/Homem Vitruviano/i)).toBeVisible();
});

test("landing lista as categorias do catálogo", async ({ page }) => {
  await page.goto("/");
  const band = page.getByRole("region", { name: "O que dá para converter" });
  for (const label of ["Planilhas", "Dados", "Documentos", "Imagens", "Mídia"]) {
    await expect(band.getByText(label, { exact: true })).toBeVisible();
  }
});

test("/app redireciona para login quando deslogado", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("login mostra opção do Google", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
});
