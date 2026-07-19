import { describe, expect, it } from "vitest";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import { MAX_JSON_SAMPLE } from "@/shared/constants/upload";
import { JsonReader } from "./json-reader";

const encode = (value: unknown): Uint8Array =>
  new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value));

describe("JsonReader", () => {
  const reader = new JsonReader();

  it("lê um array de objetos: rootKind array, itemCount e profundidade", async () => {
    const preview = await reader.read(encode([{ a: 1 }, { a: 2 }]));

    expect(preview.rootKind).toBe("array");
    expect(preview.itemCount).toBe(2);
    expect(preview.depth).toBe(3); // array → objeto → primitivo
    expect(preview.truncated).toBe(false);
    expect(preview.sample).toContain('"a": 1');
  });

  it("lê um objeto raiz: rootKind object, itemCount = nº de chaves", async () => {
    const preview = await reader.read(encode({ a: 1, b: 2, c: 3 }));

    expect(preview.rootKind).toBe("object");
    expect(preview.itemCount).toBe(3);
    expect(preview.depth).toBe(2);
  });

  it("lê um primitivo: rootKind primitive, itemCount null, depth 1", async () => {
    const preview = await reader.read(encode(42));

    expect(preview.rootKind).toBe("primitive");
    expect(preview.itemCount).toBeNull();
    expect(preview.depth).toBe(1);
  });

  it("lança InvalidFileTypeError para JSON inválido", async () => {
    await expect(reader.read(encode("{ inválido"))).rejects.toBeInstanceOf(InvalidFileTypeError);
  });

  it("trunca a amostra em MAX_JSON_SAMPLE", async () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ index: i, label: `item-${i}` }));

    const preview = await reader.read(encode(big));

    expect(preview.truncated).toBe(true);
    expect(preview.sample.length).toBe(MAX_JSON_SAMPLE);
  });
});
