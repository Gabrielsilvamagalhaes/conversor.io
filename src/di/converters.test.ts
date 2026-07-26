import { describe, expect, it } from "vitest";
import { CONVERSION_PAIRS } from "@/domain/conversion/value-objects/conversion-pair";
import { buildConverterRegistry } from "./converters";

const serverPairs = CONVERSION_PAIRS.filter((pair) => pair.live && pair.engine === "server");

/**
 * O catálogo e o registry são duas listas que precisam concordar: o catálogo governa o que a UI
 * oferece e o que `isSupportedPair` autoriza; o registry governa o que de fato converte. Um par
 * `live` sem adapter vira 500 em produção — e é exatamente o erro que se comete ao adicionar um
 * formato novo e esquecer do DI.
 */
describe("buildConverterRegistry", () => {
  it.each(
    serverPairs.map((pair) => [`${pair.from}->${pair.to}`, pair] as const),
  )("resolve um adapter para o par live %s", (_label, pair) => {
    const converter = buildConverterRegistry().resolve(pair.from, pair.to);

    expect(converter).not.toBeNull();
    expect(converter?.from).toBe(pair.from);
    expect(converter?.to).toBe(pair.to);
  });

  it("não registra adapter para par que não está live no servidor", () => {
    const registry = buildConverterRegistry();

    // `pdf -> docx` está no catálogo como "em breve"; mídia é convertida no navegador.
    expect(registry.resolve("pdf", "docx")).toBeNull();
    expect(registry.resolve("mp4", "mp3")).toBeNull();
  });

  it("registra exatamente um adapter por par live de servidor", () => {
    const registry = buildConverterRegistry();
    const resolved = serverPairs.filter((pair) => registry.resolve(pair.from, pair.to) !== null);

    expect(resolved).toHaveLength(serverPairs.length);
  });
});
