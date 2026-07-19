/**
 * Erro de conversão de mídia compartilhado entre client (ffmpeg.wasm) e server.
 *
 * O vídeo é convertido no navegador, então a presentation não pode importar as classes
 * de erro do domínio diretamente (regra de camadas). Este módulo vive em `shared/` — sem
 * dependências — e dá um vocabulário único de códigos + mensagens pt-BR para os dois lados.
 */
export type MediaErrorCode =
  | "unsupported_pair"
  | "too_large"
  | "too_long"
  | "unsupported_codec"
  | "load_failed"
  | "timeout"
  | "cancelled"
  | "unknown";

/** Mensagens honestas por tipo de falha, exibidas ao usuário. */
export const MEDIA_ERROR_MESSAGES: Record<MediaErrorCode, string> = {
  unsupported_pair: "Essa conversão de mídia não é suportada.",
  too_large: "Arquivo de mídia muito grande.",
  too_long: "Vídeo muito longo para converter.",
  unsupported_codec: "Não foi possível ler o áudio deste vídeo (formato/codec não suportado).",
  load_failed: "Falha ao carregar o conversor no navegador. Recarregue a página e tente de novo.",
  timeout: "A conversão demorou demais e foi interrompida.",
  cancelled: "Conversão cancelada.",
  unknown: "Falha inesperada na conversão.",
};

/** Erro tipado de conversão de mídia. `message` opcional sobrescreve a mensagem padrão do código. */
export class MediaError extends Error {
  constructor(
    readonly code: MediaErrorCode,
    message?: string,
  ) {
    super(message ?? MEDIA_ERROR_MESSAGES[code]);
    this.name = "MediaError";
  }
}

export function isMediaError(error: unknown): error is MediaError {
  return error instanceof MediaError;
}
