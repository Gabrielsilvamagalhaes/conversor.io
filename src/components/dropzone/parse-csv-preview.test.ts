import { describe, expect, it } from "vitest";
import { parseCsvPreview } from "./parse-csv-preview";

describe("parseCsvPreview", () => {
  it("conta linhas e colunas e devolve as linhas como matriz de strings", () => {
    const csv = "a,b,c\n1,2,3\n4,5,6";
    const result = parseCsvPreview(csv);
    expect(result.totalRows).toBe(3);
    expect(result.columns).toBe(3);
    expect(result.previewRows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("ignora linhas vazias", () => {
    const csv = "a,b\n\n1,2\n\n";
    const result = parseCsvPreview(csv);
    expect(result.totalRows).toBe(2);
  });

  it("usa a maior contagem de colunas entre as linhas", () => {
    const csv = "a,b\n1,2,3";
    const result = parseCsvPreview(csv);
    expect(result.columns).toBe(3);
  });

  it("limita a amostra a MAX_PREVIEW_ROWS mesmo com mais linhas no arquivo", () => {
    const rows = Array.from({ length: 80 }, (_, i) => `${i}`).join("\n");
    const result = parseCsvPreview(rows);
    expect(result.totalRows).toBe(80);
    expect(result.previewRows.length).toBe(50);
  });
});
