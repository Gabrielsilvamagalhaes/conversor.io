import { describe, expect, it } from "vitest";
import type { FileTypeDetectorPort } from "@/domain/conversion/ports/file-type-detector.port";
import { ValidateUploadUseCase } from "./validate-upload.use-case";

const textDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: false, signature: null }),
};
const zipDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "zip" }),
};

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("ValidateUploadUseCase", () => {
  it("aceita um csv de texto válido", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    const result = useCase.execute({
      fileName: "dados.csv",
      size: 12,
      bytes: bytes("a,b,c\n1,2,3"),
    });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("csv");
    expect(result.fileName).toBe("dados.csv");
  });

  it("rejeita arquivo vazio", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() => useCase.execute({ fileName: "x.csv", size: 0, bytes: new Uint8Array() })).toThrow(
      "vazio",
    );
  });

  it("rejeita acima do limite", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    const big = 11 * 1024 * 1024;
    expect(() => useCase.execute({ fileName: "x.csv", size: big, bytes: bytes("a") })).toThrow(
      "muito grande",
    );
  });

  it("rejeita extensão fora da allowlist", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() => useCase.execute({ fileName: "x.exe", size: 4, bytes: bytes("abcd") })).toThrow(
      "inválido",
    );
  });

  it("rejeita binário disfarçado de csv", () => {
    const useCase = new ValidateUploadUseCase(zipDetector);
    expect(() => useCase.execute({ fileName: "x.csv", size: 4, bytes: bytes("PK..") })).toThrow(
      "inválido",
    );
  });

  it("aceita um xlsx com assinatura zip", () => {
    const useCase = new ValidateUploadUseCase(zipDetector);
    const result = useCase.execute({ fileName: "planilha.xlsx", size: 2048, bytes: bytes("PK..") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("xlsx");
  });

  it("rejeita xlsx cujo conteúdo não é um container zip", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() =>
      useCase.execute({ fileName: "falso.xlsx", size: 12, bytes: bytes("a,b,c\n1,2,3") }),
    ).toThrow("inválido");
  });

  it("rejeita arquivo sem extensão", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() => useCase.execute({ fileName: "nodotfile", size: 4, bytes: bytes("abcd") })).toThrow(
      "inválido",
    );
  });
});
