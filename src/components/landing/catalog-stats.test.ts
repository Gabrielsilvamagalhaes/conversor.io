import { describe, expect, it } from "vitest";
import type { ConversionCatalogDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";
import { summarizeCatalog } from "./catalog-stats";

const catalog: ConversionCatalogDto = {
  categories: [
    {
      id: "documents",
      label: "Documentos",
      extensions: ["pdf", "docx"],
      maxSizeMb: 4,
      pairs: [
        { from: "pdf", to: "txt", live: true, engine: "server" },
        { from: "docx", to: "pdf", live: true, engine: "server" },
        { from: "pdf", to: "docx", live: false, engine: "server" },
      ],
    },
    {
      id: "media",
      label: "Mídia",
      extensions: ["mp4"],
      maxSizeMb: 100,
      pairs: [{ from: "mp4", to: "mp3", live: true, engine: "client" }],
    },
  ],
};

describe("summarizeCatalog", () => {
  it("conta apenas os pares live como conversões disponíveis", () => {
    expect(summarizeCatalog(catalog).liveConversions).toBe(3);
  });

  it("conta os pares não-live separadamente", () => {
    expect(summarizeCatalog(catalog).comingSoon).toBe(1);
  });

  it("conta formatos distintos somando origens e destinos dos pares live", () => {
    // pdf, docx, txt, mp4, mp3 — `docx` como destino de par live também conta.
    expect(summarizeCatalog(catalog).formats).toBe(5);
  });

  it("conta as categorias do catálogo", () => {
    expect(summarizeCatalog(catalog).categories).toBe(2);
  });
});
