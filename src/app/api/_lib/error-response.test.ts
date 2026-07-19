import { describe, expect, it } from "vitest";
import { ConversionTimeoutError } from "@/domain/conversion/errors/conversion-timeout.error";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { MediaTooLargeError } from "@/domain/conversion/errors/media-too-large.error";
import { UnsupportedCodecError } from "@/domain/conversion/errors/unsupported-codec.error";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";
import { VideoTooLongError } from "@/domain/conversion/errors/video-too-long.error";
import { mapDomainError } from "./error-response";

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

  it("preserva a mensagem pt-BR do erro", () => {
    const mapped = mapDomainError(new VideoTooLongError(1000, 900));
    expect(mapped?.message).toContain("Vídeo muito longo");
  });

  it("retorna null para erros desconhecidos (fallback 500 na rota)", () => {
    expect(mapDomainError(new Error("boom"))).toBeNull();
    expect(mapDomainError("nope")).toBeNull();
  });
});
