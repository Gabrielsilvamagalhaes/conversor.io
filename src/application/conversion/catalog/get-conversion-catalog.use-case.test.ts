import { describe, expect, it } from "vitest";
import { GetConversionCatalogUseCase } from "./get-conversion-catalog.use-case";

describe("GetConversionCatalogUseCase", () => {
  const catalog = new GetConversionCatalogUseCase().execute();

  it("expõe as três categorias com rótulos pt-BR na ordem esperada", () => {
    expect(catalog.categories.map((c) => c.label)).toEqual(["Planilhas", "Dados", "Documentos"]);
    expect(catalog.categories.map((c) => c.id)).toEqual(["spreadsheets", "data", "documents"]);
  });

  it("lista as extensões de origem sem duplicatas", () => {
    const documents = catalog.categories.find((c) => c.id === "documents");
    // pdf aparece em dois pares (pdf→txt, pdf→docx) mas só uma vez em extensions.
    expect(documents?.extensions).toEqual(["pdf", "docx"]);
  });

  it("preserva as flags live (docx→pdf e pdf→docx como 'em breve')", () => {
    const documents = catalog.categories.find((c) => c.id === "documents");
    const emBreve = documents?.pairs.filter((p) => !p.live).map((p) => `${p.from}->${p.to}`);
    expect(emBreve).toEqual(["docx->pdf", "pdf->docx"]);
    expect(documents?.pairs.find((p) => p.from === "pdf" && p.to === "txt")?.live).toBe(true);
  });
});
