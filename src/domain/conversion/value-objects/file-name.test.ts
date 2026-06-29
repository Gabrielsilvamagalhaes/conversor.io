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
});
