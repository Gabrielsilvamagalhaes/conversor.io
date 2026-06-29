import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./is-protected-path";

describe("isProtectedPath", () => {
  it("protege a rota exata", () => {
    expect(isProtectedPath("/app", ["/app"])).toBe(true);
  });
  it("protege subrotas", () => {
    expect(isProtectedPath("/app/upload", ["/app"])).toBe(true);
  });
  it("não protege rotas públicas", () => {
    expect(isProtectedPath("/", ["/app"])).toBe(false);
    expect(isProtectedPath("/login", ["/app"])).toBe(false);
  });
  it("não confunde prefixo parcial", () => {
    expect(isProtectedPath("/application", ["/app"])).toBe(false);
  });
});
