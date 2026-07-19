import { describe, expect, it } from "vitest";
import { CsvToJsonAdapter } from "./csv-to-json.adapter";
import { JsonToCsvAdapter } from "./json-to-csv.adapter";

const CSV = "nome,idade\nAna,30\nBruno,25";

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decode(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

describe("conversores csv↔json (integração)", () => {
  it("csv→json produz array de objetos com chaves do cabeçalho e tipos", async () => {
    const json = await new CsvToJsonAdapter().convert(bytes(CSV));
    const parsed = JSON.parse(decode(json));

    expect(parsed).toEqual([
      { nome: "Ana", idade: 30 },
      { nome: "Bruno", idade: 25 },
    ]);
    // dynamicTyping: idade é número, não string.
    expect(typeof parsed[0].idade).toBe("number");
  });

  it("round-trip csv→json→csv preserva os dados", async () => {
    const json = await new CsvToJsonAdapter().convert(bytes(CSV));
    const back = await new JsonToCsvAdapter().convert(json);
    const text = decode(back).replace(/\r\n/g, "\n").trim();

    expect(text).toBe(CSV);
  });

  it("json→csv embrulha um objeto raiz em uma única linha", async () => {
    const csv = await new JsonToCsvAdapter().convert(bytes('{"a":1,"b":2}'));
    expect(decode(csv).replace(/\r\n/g, "\n").trim()).toBe("a,b\n1,2");
  });

  it("json→csv rejeita JSON inválido", async () => {
    await expect(new JsonToCsvAdapter().convert(bytes("{não é json"))).rejects.toThrow("inválido");
  });
});
