import { describe, expect, it } from "vitest";
import { GetConversionCatalogUseCase } from "./get-conversion-catalog.use-case";

describe("GetConversionCatalogUseCase", () => {
  const catalog = new GetConversionCatalogUseCase(4).execute();

  it("expõe as cinco categorias com rótulos pt-BR na ordem esperada", () => {
    expect(catalog.categories.map((c) => c.label)).toEqual([
      "Planilhas",
      "Dados",
      "Documentos",
      "Imagens",
      "Mídia",
    ]);
    expect(catalog.categories.map((c) => c.id)).toEqual([
      "spreadsheets",
      "data",
      "documents",
      "images",
      "media",
    ]);
  });

  it("aplica o limite de tamanho por categoria (documentos via env, mídia = vídeo)", () => {
    expect(catalog.categories.find((c) => c.id === "documents")?.maxSizeMb).toBe(4);
    expect(catalog.categories.find((c) => c.id === "media")?.maxSizeMb).toBe(100);
  });

  it("marca pares de mídia como engine client e live", () => {
    const media = catalog.categories.find((c) => c.id === "media");
    expect(media?.pairs.every((p) => p.engine === "client")).toBe(true);
    expect(media?.pairs.find((p) => p.from === "mp4" && p.to === "mp3")?.live).toBe(true);
  });

  it("lista as extensões de origem sem duplicatas", () => {
    const documents = catalog.categories.find((c) => c.id === "documents");
    // pdf aparece em dois pares (pdf→txt, pdf→docx) mas só uma vez em extensions.
    expect(documents?.extensions).toEqual(["pdf", "docx", "md"]);
  });

  it("preserva as flags live (pdf→docx como 'em breve'; docx→pdf e md→pdf já ativos)", () => {
    const documents = catalog.categories.find((c) => c.id === "documents");
    const emBreve = documents?.pairs.filter((p) => !p.live).map((p) => `${p.from}->${p.to}`);
    expect(emBreve).toEqual(["pdf->docx"]);
    expect(documents?.pairs.find((p) => p.from === "pdf" && p.to === "txt")?.live).toBe(true);
    expect(documents?.pairs.find((p) => p.from === "docx" && p.to === "pdf")?.live).toBe(true);
    expect(documents?.pairs.find((p) => p.from === "md" && p.to === "pdf")?.live).toBe(true);
  });

  it("categoria images herda o limite de tamanho de documento e inclui o alias jpeg", () => {
    const images = catalog.categories.find((c) => c.id === "images");
    expect(images?.maxSizeMb).toBe(4);
    expect(images?.extensions).toContain("jpeg");
    expect(images?.pairs.every((p) => p.engine === "server" && p.live)).toBe(true);
  });
});
