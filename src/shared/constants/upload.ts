/** Limite de tamanho para documentos/dados (MVP). */
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

/** Máximo de linhas lidas para a amostra de planilha (usadas na visão expandida). */
export const MAX_PREVIEW_ROWS = 50;

/** Linhas exibidas na prévia compacta (card); o modal mostra até MAX_PREVIEW_ROWS. */
export const COMPACT_PREVIEW_ROWS = 10;

/** Máximo de caracteres da amostra de texto de PDF (fallback da prévia). */
export const MAX_PDF_TEXT_SAMPLE = 2000;

/** Máximo de caracteres da amostra pretty-printed de JSON na prévia. */
export const MAX_JSON_SAMPLE = 4000;
