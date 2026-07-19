/**
 * Limite padrão de documentos/dados, em MB. Fica **abaixo do teto de ~4.5 MB** do body de
 * função serverless da Vercel para não falhar em produção. Configurável por env
 * (`MAX_DOCUMENT_SIZE_MB`); a resolução server-side fica em `src/di/env.ts`.
 */
export const DEFAULT_MAX_DOCUMENT_SIZE_MB = 4;

/** Limite de tamanho para vídeo (convertido no navegador, não sobe ao servidor). */
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

/** Duração máxima de vídeo aceita para conversão de mídia (15 min). */
export const MAX_VIDEO_DURATION_SECONDS = 900;

/** Trecho pré-visualizado do vídeo, em segundos (prévia dos primeiros 30s). */
export const VIDEO_PREVIEW_SECONDS = 30;

/** Máximo de linhas lidas para a amostra de planilha (usadas na visão expandida). */
export const MAX_PREVIEW_ROWS = 50;

/** Linhas exibidas na prévia compacta (card); o modal mostra até MAX_PREVIEW_ROWS. */
export const COMPACT_PREVIEW_ROWS = 10;

/** Máximo de caracteres da amostra de texto de PDF (fallback da prévia). */
export const MAX_PDF_TEXT_SAMPLE = 2000;

/** Máximo de caracteres da amostra pretty-printed de JSON na prévia. */
export const MAX_JSON_SAMPLE = 4000;
