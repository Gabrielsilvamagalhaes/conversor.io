import { describe, expect, it } from "vitest";
import { CONVERSION_PAIRS, isSupportedPair, targetFor } from "./conversion-pair";

describe("conversion-pair", () => {
  it("suporta csv→xlsx e xlsx→csv", () => {
    expect(isSupportedPair("csv", "xlsx")).toBe(true);
    expect(isSupportedPair("xlsx", "csv")).toBe(true);
  });

  it("rejeita pares fora do catálogo", () => {
    expect(isSupportedPair("csv", "csv")).toBe(false);
    expect(isSupportedPair("pdf", "csv")).toBe(false);
  });

  it("targetFor resolve o destino automático", () => {
    expect(targetFor("csv")).toBe("xlsx");
    expect(targetFor("xlsx")).toBe("csv");
    expect(targetFor("pdf")).toBeNull();
  });

  it("catálogo tem exatamente dois pares", () => {
    expect(CONVERSION_PAIRS).toHaveLength(2);
  });
});
