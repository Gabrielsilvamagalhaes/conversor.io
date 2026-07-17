import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";

/** Metadados de pré-visualização de uma planilha. */
export interface SpreadsheetPreview {
  /** Total de linhas do arquivo (varredura completa). */
  readonly totalRows: number;
  /** Maior número de colunas encontrado. */
  readonly columns: number;
  /** Primeiras linhas (no máx. MAX_PREVIEW_ROWS; menos se o arquivo tiver menos). */
  readonly previewRows: readonly (readonly string[])[];
}

/** Lê metadados e uma amostra de linhas de uma planilha sem carregar tudo em memória. */
export interface SpreadsheetReaderPort {
  read(bytes: Uint8Array, extension: AcceptedExtension): Promise<SpreadsheetPreview>;
}
