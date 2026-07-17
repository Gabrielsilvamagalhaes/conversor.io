import { describe, expect, it } from "vitest";
import { ACCEPTED_EXTENSIONS, isAcceptedExtension } from "./accepted-format";

describe("accepted-format", () => {
  it("aceita csv e xlsx", () => {
    expect(isAcceptedExtension("csv")).toBe(true);
    expect(isAcceptedExtension("xlsx")).toBe(true);
  });

  it("rejeita exe e formatos fora da allowlist", () => {
    expect(isAcceptedExtension("exe")).toBe(false);
    expect(isAcceptedExtension("pdf")).toBe(false);
  });

  it("ACCEPTED_EXTENSIONS contém csv e xlsx", () => {
    expect(ACCEPTED_EXTENSIONS).toContain("csv");
    expect(ACCEPTED_EXTENSIONS).toContain("xlsx");
  });
});
