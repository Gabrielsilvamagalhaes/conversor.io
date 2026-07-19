import { describe, expect, it } from "vitest";
import {
  ACCEPTED_EXTENSIONS,
  isAcceptedExtension,
  isAudioExtension,
  isVideoExtension,
} from "./accepted-format";

describe("accepted-format", () => {
  it("aceita as extensões do catálogo (documentos + mídia)", () => {
    for (const ext of [
      "csv",
      "xlsx",
      "json",
      "pdf",
      "docx",
      "txt",
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

  it("ACCEPTED_EXTENSIONS contém as extensões suportadas", () => {
    expect(ACCEPTED_EXTENSIONS).toContain("json");
    expect(ACCEPTED_EXTENSIONS).toContain("mp4");
    expect(ACCEPTED_EXTENSIONS).toContain("mp3");
  });
});
