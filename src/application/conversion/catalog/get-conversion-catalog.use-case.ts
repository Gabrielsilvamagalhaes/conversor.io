import {
  type ConversionCategory,
  pairsForCategory,
} from "@/domain/conversion/value-objects/conversion-pair";

/** Par de conversão serializável para a UI. */
export interface CatalogPairDto {
  readonly from: string;
  readonly to: string;
  readonly live: boolean;
}

/** Categoria com seus pares e as extensões de origem aceitas para upload. */
export interface CatalogCategoryDto {
  readonly id: ConversionCategory;
  readonly label: string;
  /** Extensões de origem aceitas (`accept` do input), sem duplicatas. */
  readonly extensions: string[];
  readonly pairs: CatalogPairDto[];
}

export interface ConversionCatalogDto {
  readonly categories: CatalogCategoryDto[];
}

/** Rótulos pt-BR e ordem de exibição das categorias (detalhe de apresentação). */
const CATEGORY_LABELS: readonly { id: ConversionCategory; label: string }[] = [
  { id: "spreadsheets", label: "Planilhas" },
  { id: "data", label: "Dados" },
  { id: "documents", label: "Documentos" },
];

/**
 * Monta o catálogo de conversões agrupado por categoria a partir do domínio.
 * A presentation consome este DTO — não importa `CONVERSION_PAIRS` direto.
 */
export class GetConversionCatalogUseCase {
  execute(): ConversionCatalogDto {
    const categories = CATEGORY_LABELS.map(({ id, label }) => {
      const pairs = pairsForCategory(id);
      const extensions = [...new Set(pairs.map((pair) => pair.from))];
      return {
        id,
        label,
        extensions,
        pairs: pairs.map((pair) => ({ from: pair.from, to: pair.to, live: pair.live })),
      };
    });
    return { categories };
  }
}
