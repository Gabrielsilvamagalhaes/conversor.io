import { describe, expect, it } from "vitest";
import {
  ACCEPTED_EXTENSIONS,
  EXTENSION_ALIASES,
  isAcceptedExtension,
  isAudioExtension,
  isImageExtension,
  isVideoExtension,
  normalizeExtension,
} from "./accepted-format";

describe("accepted-format", () => {
  it("aceita as extensões do catálogo (documentos + imagens + mídia)", () => {
    for (const ext of [
      "csv",
      "xlsx",
      "json",
      "pdf",
      "docx",
      "txt",
      "md",
      "png",
      "jpg",
      "webp",
      "mp4",
      "webm",
      "mov",
      "mp3",
      "wav",
    ]) {
      expect(isAcceptedExtension(ext)).toBe(true);
    }
  });

  it("rejeita exe e formatos fora da allowlist", () => {
    expect(isAcceptedExtension("exe")).toBe(false);
    expect(isAcceptedExtension("avi")).toBe(false);
  });

  it("classifica vídeo e áudio", () => {
    expect(isVideoExtension("mp4")).toBe(true);
    expect(isVideoExtension("mp3")).toBe(false);
    expect(isAudioExtension("wav")).toBe(true);
    expect(isAudioExtension("mov")).toBe(false);
  });

  it("classifica imagem", () => {
    expect(isImageExtension("png")).toBe(true);
    expect(isImageExtension("jpg")).toBe(true);
    expect(isImageExtension("webp")).toBe(true);
    expect(isImageExtension("pdf")).toBe(false);
  });

  it("normaliza extensão: lowercase e alias jpeg -> jpg", () => {
    expect(normalizeExtension("JPEG")).toBe("jpg");
    expect(normalizeExtension("jpeg")).toBe("jpg");
    expect(normalizeExtension("PNG")).toBe("png");
    expect(normalizeExtension("csv")).toBe("csv");
    expect(EXTENSION_ALIASES.jpeg).toBe("jpg");
  });

  it("ACCEPTED_EXTENSIONS contém as extensões suportadas", () => {
    expect(ACCEPTED_EXTENSIONS).toContain("json");
    expect(ACCEPTED_EXTENSIONS).toContain("mp4");
    expect(ACCEPTED_EXTENSIONS).toContain("mp3");
    expect(ACCEPTED_EXTENSIONS).toContain("md");
    expect(ACCEPTED_EXTENSIONS).toContain("png");
  });
});
