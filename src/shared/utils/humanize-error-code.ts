import { MEDIA_ERROR_MESSAGES, type MediaErrorCode } from "@/shared/media/media-error";

/**
 * Mensagens pt-BR para os `errorCode` gravados pelo servidor — nomes de classe de erro de
 * domínio (`error.constructor.name`, ver `src/app/api/convert/route.ts`). Mantido separado
 * de `MEDIA_ERROR_MESSAGES` (códigos do cliente, ffmpeg.wasm) porque as duas fontes usam
 * vocabulários diferentes (PascalCase vs. snake_case) para o mesmo conceito.
 */
const SERVER_ERROR_MESSAGES: Record<string, string> = {
  EmptyFileError: "Arquivo vazio.",
  FileTooLargeError: "Arquivo maior que o limite permitido.",
  InvalidFileTypeError: "Tipo de arquivo não reconhecido.",
  UnsupportedConversionError: "Conversão não suportada para esse par de formatos.",
  UnsupportedCodecError: "Codec de áudio/vídeo não suportado.",
  MediaTooLargeError: "Arquivo de mídia muito grande.",
  VideoTooLongError: "Vídeo muito longo para converter.",
  ConversionTimeoutError: "A conversão demorou demais e foi interrompida.",
  UnauthorizedError: "Sessão expirada.",
  UnknownError: "Falha inesperada na conversão.",
};

function isMediaErrorCode(code: string): code is MediaErrorCode {
  return Object.hasOwn(MEDIA_ERROR_MESSAGES, code);
}

/** Último recurso: transforma um código desconhecido em algo legível, sem jargão cru. */
function humanizeUnknownCode(code: string): string {
  const spaced = code
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+Error$/i, "")
    .trim();
  if (!spaced) return "Falha desconhecida.";
  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1).toLowerCase()}.`;
}

/** Converte um `errorCode` bruto (do cliente ou do servidor) numa frase pt-BR legível. */
export function humanizeErrorCode(code: string | null): string {
  if (!code) return "Falha desconhecida.";
  if (isMediaErrorCode(code)) return MEDIA_ERROR_MESSAGES[code];
  const known = SERVER_ERROR_MESSAGES[code];
  if (known) return known;
  return humanizeUnknownCode(code);
}
