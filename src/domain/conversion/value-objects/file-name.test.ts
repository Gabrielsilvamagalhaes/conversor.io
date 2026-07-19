import { describe, expect, it } from "vitest";
import { FileName } from "./file-name";

describe("FileName", () => {
  it("extrai extensão em minúsculas", () => {
    expect(FileName.create("Dados.CSV").extension).toBe("csv");
  });

  it("remove caminho (sem path traversal)", () => {
    const name = FileName.create("../../etc/passwd.csv");
    expect(name.value).toBe("passwd.csv");
    expect(name.value).not.toContain("/");
    expect(name.value).not.toContain("..");
  });

  it("sanitiza caracteres perigosos", () => {
    expect(FileName.create("a b*?<>|.csv").value).toBe("a_b_____.csv");
  });

  it("rejeita nome vazio", () => {
    expect(() => FileName.create("   ")).toThrow("Nome de arquivo inválido.");
  });

  it("extensão vazia quando não há ponto", () => {
    expect(FileName.create("semponto").extension).toBe("");
  });

  describe("sanitizeBase", () => {
    it("mantém nome-base válido", () => {
      expect(FileName.sanitizeBase("relatorio-final_2025")).toBe("relatorio-final_2025");
    });

    it("remove caminho (sem path traversal)", () => {
      expect(FileName.sanitizeBase("../../etc/passwd")).toBe("passwd");
    });

    it("sanitiza caracteres perigosos", () => {
      expect(FileName.sanitizeBase("a b*?<>|")).toBe("a_b_____");
    });

    it("remove pontos nas bordas", () => {
      expect(FileName.sanitizeBase("...nome...")).toBe("nome");
    });

    it("rejeita nome que fica vazio após sanitização", () => {
      expect(() => FileName.sanitizeBase("///")).toThrow("Nome de arquivo inválido.");
    });
  });
});
