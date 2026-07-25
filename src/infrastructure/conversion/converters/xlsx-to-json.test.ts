import { describe, expect, it } from "vitest";
import { CsvToXlsxAdapter } from "./csv-to-xlsx.adapter";
import { XlsxToJsonAdapter } from "./xlsx-to-json.adapter";

const CSV = "nome,idade,ativo,observacao\nAna,30,true,\nBruno,25,false,ok";

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("XlsxToJsonAdapter (integração, round-trip csv→xlsx→json)", () => {
  it("converte a primeira planilha em um array de objetos com os tipos corretos", async () => {
    const xlsx = await new CsvToXlsxAdapter().convert(bytes(CSV));
    const json = await new XlsxToJsonAdapter().convert(xlsx);

    const text = new TextDecoder().decode(json);
    expect(text).toContain("\n"); // saída indentada, não uma linha só.

    const parsed = JSON.parse(text);
    expect(parsed).toEqual([
      { nome: "Ana", idade: 30, ativo: true, observacao: null },
      { nome: "Bruno", idade: 25, ativo: false, observacao: "ok" },
    ]);
  });

  it("planilha sem linhas de dados vira []", async () => {
    const xlsx = await new CsvToXlsxAdapter().convert(bytes("apenas,cabecalho"));
    const json = await new XlsxToJsonAdapter().convert(xlsx);

    expect(new TextDecoder().decode(json)).toBe("[]");
  });

  it("cabeçalho vazio ou duplicado gera chaves estáveis em vez de sobrescrever", async () => {
    const csv = "nome,nome,\nAna,Silva,extra";
    const xlsx = await new CsvToXlsxAdapter().convert(bytes(csv));
    const json = await new XlsxToJsonAdapter().convert(xlsx);

    const parsed = JSON.parse(new TextDecoder().decode(json));
    expect(parsed).toEqual([{ nome: "Ana", nome_2: "Silva", coluna_3: "extra" }]);
  });
});
