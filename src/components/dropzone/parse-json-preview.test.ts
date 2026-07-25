import { describe, expect, it } from "vitest";
import { parseJsonPreview } from "./parse-json-preview";

describe("parseJsonPreview", () => {
  it("identifica raiz array e conta itens", () => {
    const result = parseJsonPreview(JSON.stringify([1, 2, 3]));
    expect(result.rootKind).toBe("array");
    expect(result.itemCount).toBe(3);
    expect(result.depth).toBe(2);
  });

  it("identifica raiz objeto e conta chaves", () => {
    const result = parseJsonPreview(JSON.stringify({ a: 1, b: 2 }));
    expect(result.rootKind).toBe("object");
    expect(result.itemCount).toBe(2);
  });

  it("identifica raiz primitiva sem itemCount", () => {
    const result = parseJsonPreview(JSON.stringify(42));
    expect(result.rootKind).toBe("primitive");
    expect(result.itemCount).toBeNull();
    expect(result.depth).toBe(1);
  });

  it("calcula profundidade de aninhamento", () => {
    const result = parseJsonPreview(JSON.stringify({ a: { b: { c: 1 } } }));
    expect(result.depth).toBe(4);
  });

  it("trunca a amostra além de MAX_JSON_SAMPLE e sinaliza truncated", () => {
    const big = { items: Array.from({ length: 500 }, (_, i) => ({ id: i, name: `item-${i}` })) };
    const result = parseJsonPreview(JSON.stringify(big));
    expect(result.truncated).toBe(true);
    expect(result.sample.length).toBeLessThanOrEqual(4000);
  });

  it("lança em JSON inválido", () => {
    expect(() => parseJsonPreview("{ invalid")).toThrow();
  });
});
