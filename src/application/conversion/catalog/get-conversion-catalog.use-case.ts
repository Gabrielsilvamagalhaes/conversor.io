import { EXTENSION_ALIASES } from "@/domain/conversion/value-objects/accepted-format";
import {
  type ConversionCategory,
  type ConversionEngine,
  pairsForCategory,
} from "@/domain/conversion/value-objects/conversion-pair";
import { MAX_VIDEO_SIZE_MB } from "@/shared/constants/upload";

/** Par de conversão serializável para a UI. */
export interface CatalogPairDto {
  readonly from: string;
  readonly to: string;
  readonly live: boolean;
  /** Onde a conversão roda: `server` (rota /api/convert) ou `client` (ffmpeg.wasm no navegador). */
  readonly engine: ConversionEngine;
}

/** Categoria com seus pares e as extensões de origem aceitas para upload. */
export interface CatalogCategoryDto {
  readonly id: ConversionCategory;
  readonly label: string;
  /** Extensões de origem aceitas (`accept` do input), sem duplicatas. */
  readonly extensions: string[];
  /** Limite de tamanho de upload da categoria, em MB (documentos via env; mídia = vídeo). */
  readonly maxSizeMb: number;
  readonly pairs: CatalogPairDto[];
}

export interface ConversionCatalogDto {
  readonly categories: CatalogCategoryDto[];
}

/**
 * Rótulos pt-BR das categorias (detalhe de apresentação). `Record<ConversionCategory, string>`
 * é intencional: hoje, uma categoria nova sem rótulo aqui simplesmente sumia da UI sem
 * nenhum erro (o array antigo não cobria o tipo); com o `Record`, esquecer uma categoria
 * vira erro de compilação (`tsc --noEmit`) em vez de bug silencioso em produção.
 */
const CATEGORY_LABELS: Record<ConversionCategory, string> = {
  spreadsheets: "Planilhas",
  data: "Dados",
  documents: "Documentos",
  images: "Imagens",
  media: "Mídia",
};

/** Ordem de exibição das categorias na UI (abas). */
const CATEGORY_ORDER: readonly ConversionCategory[] = [
  "spreadsheets",
  "data",
  "documents",
  "images",
  "media",
];

/**
 * Monta o catálogo de conversões agrupado por categoria a partir do domínio.
 * A presentation consome este DTO — não importa `CONVERSION_PAIRS` direto.
 */
export class GetConversionCatalogUseCase {
  constructor(private readonly maxDocumentSizeMb: number) {}

  execute(): ConversionCatalogDto {
    const categories = CATEGORY_ORDER.map((id) => {
      const label = CATEGORY_LABELS[id];
      const pairs = pairsForCategory(id);
      const fromExtensions = new Set(pairs.map((pair) => pair.from));
      // Inclui aliases (ex.: `jpeg` ao lado de `jpg`) no `accept` do input de arquivo —
      // sem isso o seletor de arquivos do navegador não deixa escolher `.jpeg`.
      const aliasExtensions = Object.entries(EXTENSION_ALIASES)
        .filter(([, canonical]) => fromExtensions.has(canonical))
        .map(([alias]) => alias);
      const extensions = [...fromExtensions, ...aliasExtensions];
      return {
        id,
        label,
        extensions,
        maxSizeMb: id === "media" ? MAX_VIDEO_SIZE_MB : this.maxDocumentSizeMb,
        pairs: pairs.map((pair) => ({
          from: pair.from,
          to: pair.to,
          live: pair.live,
          engine: pair.engine,
        })),
      };
    });
    return { categories };
  }
}
