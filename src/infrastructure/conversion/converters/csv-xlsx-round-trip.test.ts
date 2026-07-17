import { describe, expect, it } from "vitest";
import { SpreadsheetReader } from "@/infrastructure/conversion/spreadsheet/spreadsheet-reader";
import { CsvToXlsxAdapter } from "./csv-to-xlsx.adapter";
import { XlsxToCsvAdapter } from "./xlsx-to-csv.adapter";

const CSV = "nome,idade\nAna,30\nBruno,25";

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("conversores csv↔xlsx (integração)", () => {
  it("round-trip csv→xlsx→csv preserva os dados", async () => {
    const xlsx = await new CsvToXlsxAdapter().convert(bytes(CSV));
    expect(xlsx.length).toBeGreaterThan(0);

    const back = await new XlsxToCsvAdapter().convert(xlsx);
    const text = new TextDecoder().decode(back).replace(/\r\n/g, "\n").trim();
    expect(text).toBe(CSV);
  });

  it("preview de csv conta linhas/colunas e limita a 10 linhas", async () => {
    const many = ["h1,h2", ...Array.from({ length: 15 }, (_, i) => `${i},x`)].join("\n");
    const preview = await new SpreadsheetReader().read(bytes(many), "csv");

    expect(preview.totalRows).toBe(16);
    expect(preview.columns).toBe(2);
    expect(preview.previewRows).toHaveLength(10);
  });

  it("preview de xlsx conta linhas e colunas", async () => {
    const xlsx = await new CsvToXlsxAdapter().convert(bytes(CSV));
    const preview = await new SpreadsheetReader().read(xlsx, "xlsx");

    expect(preview.totalRows).toBe(3);
    expect(preview.columns).toBe(2);
  });
});
