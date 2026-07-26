import { describe, expect, it } from "vitest";
import type { FileTypeDetectorPort } from "@/domain/conversion/ports/file-type-detector.port";
import { ValidateUploadUseCase } from "./validate-upload.use-case";

const textDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: false, signature: null }),
};
const zipDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "zip" }),
};
const pdfDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "pdf" }),
};
const pngDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "png" }),
};
const webpDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "webp" }),
};

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

const MAX = 10 * 1024 * 1024;

describe("ValidateUploadUseCase", () => {
  it("aceita um csv de texto válido", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
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
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    expect(() => useCase.execute({ fileName: "x.csv", size: 0, bytes: new Uint8Array() })).toThrow(
      "vazio",
    );
  });

  it("rejeita acima do limite", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    const big = 11 * 1024 * 1024;
    expect(() => useCase.execute({ fileName: "x.csv", size: big, bytes: bytes("a") })).toThrow(
      "muito grande",
    );
  });

  it("rejeita extensão fora da allowlist", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    expect(() => useCase.execute({ fileName: "x.exe", size: 4, bytes: bytes("abcd") })).toThrow(
      "inválido",
    );
  });

  it("rejeita binário disfarçado de csv", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    expect(() => useCase.execute({ fileName: "x.csv", size: 4, bytes: bytes("PK..") })).toThrow(
      "inválido",
    );
  });

  it("aceita um xlsx com assinatura zip", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    const result = useCase.execute({ fileName: "planilha.xlsx", size: 2048, bytes: bytes("PK..") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("xlsx");
  });

  it("rejeita xlsx cujo conteúdo não é um container zip", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    expect(() =>
      useCase.execute({ fileName: "falso.xlsx", size: 12, bytes: bytes("a,b,c\n1,2,3") }),
    ).toThrow("inválido");
  });

  it("aceita um json de texto válido", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    const result = useCase.execute({ fileName: "dados.json", size: 20, bytes: bytes('[{"a":1}]') });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("json");
  });

  it("rejeita binário disfarçado de json", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    expect(() => useCase.execute({ fileName: "x.json", size: 4, bytes: bytes("PK..") })).toThrow(
      "inválido",
    );
  });

  it("aceita um pdf com assinatura %PDF", () => {
    const useCase = new ValidateUploadUseCase(pdfDetector, MAX);
    const result = useCase.execute({ fileName: "doc.pdf", size: 2048, bytes: bytes("%PDF-1.7") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("pdf");
  });

  it("rejeita pdf sem a assinatura %PDF", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    expect(() =>
      useCase.execute({ fileName: "falso.pdf", size: 12, bytes: bytes("texto") }),
    ).toThrow("inválido");
  });

  it("aceita um docx com assinatura zip", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    const result = useCase.execute({ fileName: "carta.docx", size: 4096, bytes: bytes("PK..") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("docx");
  });

  it("rejeita arquivo sem extensão", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    expect(() => useCase.execute({ fileName: "nodotfile", size: 4, bytes: bytes("abcd") })).toThrow(
      "inválido",
    );
  });

  it("aceita um png com assinatura png", () => {
    const useCase = new ValidateUploadUseCase(pngDetector, MAX);
    const result = useCase.execute({ fileName: "foto.png", size: 2048, bytes: bytes("\x89PNG") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("png");
  });

  it("rejeita png cujo conteúdo é um container zip", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    expect(() =>
      useCase.execute({ fileName: "falso.png", size: 12, bytes: bytes("PK..") }),
    ).toThrow("inválido");
  });

  it("aceita um webp com assinatura webp", () => {
    const useCase = new ValidateUploadUseCase(webpDetector, MAX);
    const result = useCase.execute({ fileName: "foto.webp", size: 2048, bytes: bytes("RIFF") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("webp");
  });

  it("aceita um md de texto válido", () => {
    const useCase = new ValidateUploadUseCase(textDetector, MAX);
    const result = useCase.execute({
      fileName: "notas.md",
      size: 12,
      bytes: bytes("# Título\n\ntexto"),
    });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("md");
  });

  it("rejeita md com bytes binários (ex.: UTF-16 com byte NUL)", () => {
    const useCase = new ValidateUploadUseCase(zipDetector, MAX);
    expect(() => useCase.execute({ fileName: "notas.md", size: 12, bytes: bytes("PK..") })).toThrow(
      "inválido",
    );
  });
});
