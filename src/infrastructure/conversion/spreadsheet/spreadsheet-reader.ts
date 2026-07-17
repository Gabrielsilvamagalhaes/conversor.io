import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type {
  SpreadsheetPreview,
  SpreadsheetReaderPort,
} from "@/domain/conversion/ports/spreadsheet-reader.port";
import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import { cellToString } from "@/infrastructure/conversion/spreadsheet/cell-value";
import { MAX_PREVIEW_ROWS } from "@/shared/constants/upload";

/**
 * Lê metadados (total de linhas, colunas) e as primeiras MAX_PREVIEW_ROWS linhas.
 * CSV via papaparse `step`; XLSX via WorkbookReader em streaming — ambos linha a
 * linha para não carregar o arquivo inteiro em memória.
 */
export class SpreadsheetReader implements SpreadsheetReaderPort {
  read(bytes: Uint8Array, extension: AcceptedExtension): Promise<SpreadsheetPreview> {
    return extension === "csv" ? this.readCsv(bytes) : this.readXlsx(bytes);
  }

  private readCsv(bytes: Uint8Array): Promise<SpreadsheetPreview> {
    const csv = new TextDecoder("utf-8").decode(bytes);
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

    return Promise.resolve({ totalRows, columns, previewRows });
  }

  private async readXlsx(bytes: Uint8Array): Promise<SpreadsheetPreview> {
    const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(Buffer.from(bytes)), {});
    const previewRows: string[][] = [];
    let totalRows = 0;
    let columns = 0;

    for await (const worksheet of reader) {
      for await (const row of worksheet) {
        const values = row.values as unknown[];
        const cells = values.slice(1).map((value) => cellToString(value));
        totalRows += 1;
        if (cells.length > columns) columns = cells.length;
        if (previewRows.length < MAX_PREVIEW_ROWS) previewRows.push(cells);
      }
      break; // apenas a primeira planilha no MVP
    }

    return { totalRows, columns, previewRows };
  }
}
