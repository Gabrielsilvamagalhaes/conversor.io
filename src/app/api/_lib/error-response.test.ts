import { describe, expect, it, vi } from "vitest";
import { ConversionTimeoutError } from "@/domain/conversion/errors/conversion-timeout.error";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { MediaTooLargeError } from "@/domain/conversion/errors/media-too-large.error";
import { UnsupportedCodecError } from "@/domain/conversion/errors/unsupported-codec.error";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";
import { VideoTooLongError } from "@/domain/conversion/errors/video-too-long.error";
import { UnauthorizedError } from "@/domain/identity/errors/auth-errors";
import type { LoggerPort } from "@/domain/observability/ports/logger.port";
import { mapDomainError, toErrorResponse } from "./error-response";

describe("mapDomainError", () => {
  it("mapeia erros de validação de documento para 400", () => {
    expect(mapDomainError(new EmptyFileError())?.status).toBe(400);
    expect(mapDomainError(new FileTooLargeError(10, 4))?.status).toBe(400);
    expect(mapDomainError(new UnsupportedConversionError("mp4", "mp3"))?.status).toBe(400);
  });

  it("mapeia erros de mídia para 400", () => {
    expect(mapDomainError(new VideoTooLongError(1000, 900))?.status).toBe(400);
    expect(mapDomainError(new MediaTooLargeError(200, 100))?.status).toBe(400);
    expect(mapDomainError(new UnsupportedCodecError("x"))?.status).toBe(400);
  });

  it("mapeia timeout de conversão para 408", () => {
    expect(mapDomainError(new ConversionTimeoutError())?.status).toBe(408);
  });

  it("mapeia erro de autenticação para 401", () => {
    expect(mapDomainError(new UnauthorizedError())?.status).toBe(401);
  });

  it("preserva a mensagem pt-BR do erro", () => {
    const mapped = mapDomainError(new VideoTooLongError(1000, 900));
    expect(mapped?.message).toContain("Vídeo muito longo");
  });

  it("retorna null para erros desconhecidos (fallback 500 na rota)", () => {
    expect(mapDomainError(new Error("boom"))).toBeNull();
    expect(mapDomainError("nope")).toBeNull();
  });
});

function createLoggerSpy(): LoggerPort {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
}

describe("toErrorResponse", () => {
  it("não chama o logger quando o erro é mapeado (400/408/401)", async () => {
    const logger = createLoggerSpy();
    const response = toErrorResponse(new EmptyFileError(), "fallback", logger);

    expect(response.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("loga o erro original no fallback 500 sem vazá-lo na resposta HTTP", async () => {
    const logger = createLoggerSpy();
    const original = new Error("boom interno com detalhe sensível");

    const response = toErrorResponse(original, "algo deu errado", logger);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "algo deu errado" });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith({
      event: "unhandled_error",
      status: 500,
      error: original,
    });
  });

  it("funciona sem logger (parâmetro opcional, compatibilidade com callers atuais)", async () => {
    const response = toErrorResponse(new Error("boom"), "algo deu errado");
    expect(response.status).toBe(500);
  });
});
