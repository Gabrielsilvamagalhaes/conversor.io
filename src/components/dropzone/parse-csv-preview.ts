import Papa from "papaparse";
import { MAX_PREVIEW_ROWS } from "@/shared/constants/upload";

export interface CsvPreviewData {
  readonly totalRows: number;
  readonly columns: number;
  readonly previewRows: string[][];
}

/**
 * Parse client-side de um CSV de saída (resultado de conversão) para a prévia do painel de
 * resultado. Espelha `SpreadsheetReader.readCsv` (infra, server-side) — duplicado aqui de
 * propósito: o resultado nunca passa pelo servidor de novo, então a leitura tem que
 * acontecer no navegador com o mesmo formato de dados que `SpreadsheetPreview` já consome.
 */
export function parseCsvPreview(csv: string): CsvPreviewData {
  const previewRows: string[][] = [];
  let totalRows = 0;
  let columns = 0;

  Papa.parse<string[]>(csv, {
    skipEmptyLines: "greedy",
    step: (result) => {
      const row = result.data;
      totalRows += 1;
      if (row.length > columns) columns = row.length;
      if (previewRows.length < MAX_PREVIEW_ROWS) previewRows.push(row);
    },
  });

  return { totalRows, columns, previewRows };
}
