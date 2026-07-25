import { describe, expect, it } from "vitest";
import { humanizeErrorCode } from "./humanize-error-code";

describe("humanizeErrorCode", () => {
  it("retorna mensagem padrão para código nulo", () => {
    expect(humanizeErrorCode(null)).toBe("Falha desconhecida.");
  });

  it("traduz códigos de mídia (cliente, snake_case)", () => {
    expect(humanizeErrorCode("too_large")).toBe("Arquivo de mídia muito grande.");
    expect(humanizeErrorCode("unsupported_codec")).toBe(
      "Não foi possível ler o áudio deste vídeo (formato/codec não suportado).",
    );
  });

  it("traduz nomes de erro de domínio conhecidos (servidor, PascalCase)", () => {
    expect(humanizeErrorCode("ConversionTimeoutError")).toBe(
      "A conversão demorou demais e foi interrompida.",
    );
    expect(humanizeErrorCode("FileTooLargeError")).toBe("Arquivo maior que o limite permitido.");
  });

  it("humaniza um código desconhecido sem expor jargão cru", () => {
    expect(humanizeErrorCode("SomeWeirdCustomError")).toBe("Some weird custom.");
    expect(humanizeErrorCode("SNAKE_CASE_CODE")).toBe("Snake case code.");
  });
});
