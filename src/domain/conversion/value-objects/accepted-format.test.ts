import { describe, expect, it } from "vitest";
import { ACCEPTED_EXTENSIONS, isAcceptedExtension } from "./accepted-format";

describe("accepted-format", () => {
  it("aceita csv", () => {
    expect(isAcceptedExtension("csv")).toBe(true);
  });

  it("rejeita exe e formatos fora da allowlist", () => {
    expect(isAcceptedExtension("exe")).toBe(false);
    expect(isAcceptedExtension("xlsx")).toBe(false);
  });

  it("expõe a allowlist como readonly", () => {
    expect(ACCEPTED_EXTENSIONS).toContain("csv");
  });
});
