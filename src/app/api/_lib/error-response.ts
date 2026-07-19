import { NextResponse } from "next/server";
import { ConversionTimeoutError } from "@/domain/conversion/errors/conversion-timeout.error";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import { MediaTooLargeError } from "@/domain/conversion/errors/media-too-large.error";
import { UnsupportedCodecError } from "@/domain/conversion/errors/unsupported-codec.error";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";
import { VideoTooLongError } from "@/domain/conversion/errors/video-too-long.error";

/** Erro de domínio mapeado para status HTTP + mensagem (pt-BR, vinda do próprio erro). */
export interface MappedError {
  readonly status: number;
  readonly message: string;
}

/**
 * Mapa único domínio → HTTP, compartilhado pelas rotas de conversão.
 * Retorna `null` para erros desconhecidos (a rota decide o fallback 500).
 */
export function mapDomainError(error: unknown): MappedError | null {
  if (
    error instanceof EmptyFileError ||
    error instanceof FileTooLargeError ||
    error instanceof InvalidFileTypeError ||
    error instanceof UnsupportedConversionError ||
    error instanceof VideoTooLongError ||
    error instanceof MediaTooLargeError ||
    error instanceof UnsupportedCodecError
  ) {
    return { status: 400, message: error.message };
  }
  if (error instanceof ConversionTimeoutError) {
    return { status: 408, message: error.message };
  }
  return null;
}

/**
 * Converte um erro capturado em `NextResponse` JSON. Erros de domínio conhecidos viram
 * `{ status, message }`; o resto vira 500 com `fallbackMessage`.
 */
export function toErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  const mapped = mapDomainError(error);
  if (mapped) {
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
