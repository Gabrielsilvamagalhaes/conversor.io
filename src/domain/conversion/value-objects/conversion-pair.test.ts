import { describe, expect, it } from "vitest";
import {
  CONVERSION_PAIRS,
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
    expect(isSupportedPair("pdf", "txt")).toBe(true);
  });

  it("rejeita pares 'em breve' (live: false) mesmo estando no catálogo", () => {
    expect(isSupportedPair("docx", "pdf")).toBe(false);
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
    expect(liveTargetsFor("docx", "documents")).toEqual([]);
  });

  it("pairsForCategory inclui os 'em breve'", () => {
    const docs = pairsForCategory("documents");
    expect(docs.map((p) => `${p.from}->${p.to}`)).toEqual(["pdf->txt", "docx->pdf", "pdf->docx"]);
    expect(docs.filter((p) => !p.live)).toHaveLength(2);
  });

  it("catálogo cobre as três categorias", () => {
    const categories = new Set(CONVERSION_PAIRS.map((p) => p.category));
    expect(categories).toEqual(new Set(["spreadsheets", "data", "documents"]));
  });
});
