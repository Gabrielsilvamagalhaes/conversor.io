import { describe, expect, it } from "vitest";
import { resolveResultPreviewKind } from "./preview-kind";

describe("resolveResultPreviewKind", () => {
  it("txt → text", () => {
    expect(resolveResultPreviewKind("txt")).toBe("text");
  });

  it("csv → spreadsheet", () => {
    expect(resolveResultPreviewKind("csv")).toBe("spreadsheet");
  });

  it("json → json", () => {
    expect(resolveResultPreviewKind("json")).toBe("json");
  });

  it("pdf → pdf", () => {
    expect(resolveResultPreviewKind("pdf")).toBe("pdf");
  });

  it("mp3 e wav → audio", () => {
    expect(resolveResultPreviewKind("mp3")).toBe("audio");
    expect(resolveResultPreviewKind("wav")).toBe("audio");
  });

  it("xlsx → xlsx (sem prévia de conteúdo)", () => {
    expect(resolveResultPreviewKind("xlsx")).toBe("xlsx");
  });

  it("extensão desconhecida → generic", () => {
    expect(resolveResultPreviewKind("docx")).toBe("generic");
    expect(resolveResultPreviewKind("")).toBe("generic");
  });

  it("é case-insensitive e ignora espaços nas bordas", () => {
    expect(resolveResultPreviewKind(" PDF ")).toBe("pdf");
    expect(resolveResultPreviewKind("CSV")).toBe("spreadsheet");
  });
});
