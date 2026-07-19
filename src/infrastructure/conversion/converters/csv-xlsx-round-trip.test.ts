import { describe, expect, it } from "vitest";
import { SpreadsheetReader } from "@/infrastructure/conversion/spreadsheet/spreadsheet-reader";
import { MAX_PREVIEW_ROWS } from "@/shared/constants/upload";
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

  it("preview de csv conta linhas/colunas e limita a amostra a MAX_PREVIEW_ROWS", async () => {
    const many = ["h1,h2", ...Array.from({ length: 15 }, (_, i) => `${i},x`)].join("\n");
    const preview = await new SpreadsheetReader().read(bytes(many), "csv");

    expect(preview.totalRows).toBe(16);
    expect(preview.columns).toBe(2);
    // 16 linhas < MAX_PREVIEW_ROWS (50): a amostra traz todas.
    expect(preview.previewRows).toHaveLength(16);
  });

  it("amostra de csv nunca excede MAX_PREVIEW_ROWS", async () => {
    const rowCount = MAX_PREVIEW_ROWS + 20;
    const many = ["h1,h2", ...Array.from({ length: rowCount }, (_, i) => `${i},x`)].join("\n");
    const preview = await new SpreadsheetReader().read(bytes(many), "csv");

    expect(preview.previewRows).toHaveLength(MAX_PREVIEW_ROWS);
  });

  it("preview de xlsx conta linhas e colunas", async () => {
    const xlsx = await new CsvToXlsxAdapter().convert(bytes(CSV));
    const preview = await new SpreadsheetReader().read(xlsx, "xlsx");

    expect(preview.totalRows).toBe(3);
    expect(preview.columns).toBe(2);
  });
});
