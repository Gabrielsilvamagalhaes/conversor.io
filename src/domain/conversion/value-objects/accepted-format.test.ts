import { describe, expect, it } from "vitest";
import { ACCEPTED_EXTENSIONS, isAcceptedExtension } from "./accepted-format";

describe("accepted-format", () => {
  it("aceita as extensões do catálogo", () => {
    for (const ext of ["csv", "xlsx", "json", "pdf", "docx", "txt"]) {
      expect(isAcceptedExtension(ext)).toBe(true);
    }
  });

  it("rejeita exe e formatos fora da allowlist", () => {
    expect(isAcceptedExtension("exe")).toBe(false);
    expect(isAcceptedExtension("mp4")).toBe(false);
  });

  it("ACCEPTED_EXTENSIONS contém as seis extensões suportadas", () => {
    expect(ACCEPTED_EXTENSIONS).toHaveLength(6);
    expect(ACCEPTED_EXTENSIONS).toContain("json");
    expect(ACCEPTED_EXTENSIONS).toContain("pdf");
  });
});
