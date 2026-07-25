import { describe, expect, it } from "vitest";
import { sanitizeBaseName, stripExtension } from "./file-naming";

describe("stripExtension", () => {
  it("remove a extensão final", () => {
    expect(stripExtension("relatorio.csv")).toBe("relatorio");
  });

  it("remove só a última extensão em nomes com múltiplos pontos", () => {
    expect(stripExtension("relatorio.final.csv")).toBe("relatorio.final");
  });

  it("mantém nomes sem extensão intactos", () => {
    expect(stripExtension("relatorio")).toBe("relatorio");
  });
});

describe("sanitizeBaseName", () => {
  it("troca caracteres inválidos por underscore", () => {
    expect(sanitizeBaseName("meu arquivo #1")).toBe("meu_arquivo__1");
  });

  it("descarta path traversal, mantendo só o nome final", () => {
    expect(sanitizeBaseName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeBaseName("C:\\Users\\a\\arquivo")).toBe("arquivo");
  });

  it("colapsa pontos repetidos e remove pontos nas bordas", () => {
    expect(sanitizeBaseName("...arquivo..nome...")).toBe("arquivo.nome");
  });
});
