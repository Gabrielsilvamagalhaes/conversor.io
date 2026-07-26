import type { ConversionCatalogDto } from "@/application/conversion/catalog/get-conversion-catalog.use-case";

export interface CatalogStats {
  /** Pares prontos para usar hoje (exclui os "em breve"). */
  readonly liveConversions: number;
  /** Extensões distintas aceitas como origem, sem contar aliases (`jpeg` conta com `jpg`). */
  readonly formats: number;
  readonly categories: number;
  /** Pares anunciados mas ainda sem adapter. */
  readonly comingSoon: number;
}

/**
 * Números exibidos na landing, derivados do catálogo real. Existe para que a home nunca
 * anuncie uma contagem escrita à mão — foi assim que ela passou meses dizendo que
 * `docx → pdf` estava "em breve" depois de o par já estar no ar.
 */
export function summarizeCatalog(catalog: ConversionCatalogDto): CatalogStats {
  const pairs = catalog.categories.flatMap((category) => category.pairs);
  const sources = new Set(pairs.filter((pair) => pair.live).map((pair) => pair.from));
  const targets = new Set(pairs.filter((pair) => pair.live).map((pair) => pair.to));

  return {
    liveConversions: pairs.filter((pair) => pair.live).length,
    formats: new Set([...sources, ...targets]).size,
    categories: catalog.categories.length,
    comingSoon: pairs.filter((pair) => !pair.live).length,
  };
}
