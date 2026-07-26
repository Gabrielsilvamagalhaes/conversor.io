import { describe, expect, it } from "vitest";
import {
  CONVERSION_PAIRS,
  isClientConvertiblePair,
  isSupportedPair,
  liveTargetsFor,
  pairsForCategory,
} from "./conversion-pair";

describe("conversion-pair", () => {
  it("suporta os pares ativos (live)", () => {
    expect(isSupportedPair("csv", "xlsx")).toBe(true);
    expect(isSupportedPair("xlsx", "csv")).toBe(true);
    expect(isSupportedPair("csv", "json")).toBe(true);
    expect(isSupportedPair("json", "csv")).toBe(true);
    expect(isSupportedPair("xlsx", "json")).toBe(true);
    expect(isSupportedPair("pdf", "txt")).toBe(true);
    expect(isSupportedPair("docx", "pdf")).toBe(true);
  });

  it("rejeita pares 'em breve' (live: false) mesmo estando no catálogo", () => {
    expect(isSupportedPair("pdf", "docx")).toBe(false);
  });

  it("rejeita pares fora do catálogo", () => {
    expect(isSupportedPair("csv", "csv")).toBe(false);
    expect(isSupportedPair("txt", "pdf")).toBe(false);
  });

  it("liveTargetsFor resolve destinos por categoria (desambigua csv)", () => {
    expect(liveTargetsFor("csv", "spreadsheets")).toEqual(["xlsx"]);
    expect(liveTargetsFor("csv", "data")).toEqual(["json"]);
    expect(liveTargetsFor("pdf", "documents")).toEqual(["txt"]);
    expect(liveTargetsFor("docx", "documents")).toEqual(["pdf"]);
  });

  it("liveTargetsFor desambigua xlsx (spreadsheets vs. data), como já ocorre com csv", () => {
    expect(liveTargetsFor("xlsx", "spreadsheets")).toEqual(["csv"]);
    expect(liveTargetsFor("xlsx", "data")).toEqual(["json"]);
  });

  it("xlsx aparece nas duas categorias do catálogo, cada uma com seu próprio par", () => {
    const inSpreadsheets = CONVERSION_PAIRS.filter(
      (p) => p.from === "xlsx" && p.category === "spreadsheets",
    );
    const inData = CONVERSION_PAIRS.filter((p) => p.from === "xlsx" && p.category === "data");
    expect(inSpreadsheets).toEqual([
      { from: "xlsx", to: "csv", category: "spreadsheets", live: true, engine: "server" },
    ]);
    expect(inData).toEqual([
      { from: "xlsx", to: "json", category: "data", live: true, engine: "server" },
    ]);
  });

  it("pairsForCategory inclui os 'em breve'", () => {
    const docs = pairsForCategory("documents");
    expect(docs.map((p) => `${p.from}->${p.to}`)).toEqual([
      "pdf->txt",
      "docx->pdf",
      "md->pdf",
      "pdf->docx",
    ]);
    expect(docs.filter((p) => !p.live)).toHaveLength(1);
    expect(docs[docs.length - 1]?.live).toBe(false);

    const data = pairsForCategory("data");
    expect(data.map((p) => `${p.from}->${p.to}`)).toEqual(["csv->json", "json->csv", "xlsx->json"]);
  });

  it("pairsForCategory cobre a categoria images", () => {
    const images = pairsForCategory("images");
    expect(images.map((p) => `${p.from}->${p.to}`)).toEqual([
      "png->jpg",
      "jpg->png",
      "webp->png",
      "webp->jpg",
      "png->webp",
      "jpg->webp",
    ]);
    expect(images.every((p) => p.live && p.engine === "server")).toBe(true);
  });

  it("catálogo cobre as cinco categorias", () => {
    const categories = new Set(CONVERSION_PAIRS.map((p) => p.category));
    expect(categories).toEqual(new Set(["spreadsheets", "data", "documents", "images", "media"]));
  });

  it("isSupportedPair (servidor) rejeita pares de mídia com engine client", () => {
    expect(isSupportedPair("mp4", "mp3")).toBe(false);
    expect(isSupportedPair("webm", "wav")).toBe(false);
  });

  it("isClientConvertiblePair vale só para pares de mídia live", () => {
    expect(isClientConvertiblePair("mp4", "mp3")).toBe(true);
    expect(isClientConvertiblePair("mov", "wav")).toBe(true);
    expect(isClientConvertiblePair("csv", "xlsx")).toBe(false);
  });
});
