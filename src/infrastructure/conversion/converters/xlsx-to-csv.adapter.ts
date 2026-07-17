import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { cellToString } from "@/infrastructure/conversion/spreadsheet/cell-value";

/**
 * `.xlsx` → `.csv`. Lê a primeira planilha via WorkbookReader em streaming
 * (linha a linha) e serializa cada linha em CSV com papaparse — evita materializar
 * o workbook inteiro.
 */
export class XlsxToCsvAdapter implements FileConverterPort {
  readonly from = "xlsx" as const;
  readonly to = "csv" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(Buffer.from(bytes)), {});
    const lines: string[] = [];

    for await (const worksheet of reader) {
      for await (const row of worksheet) {
        const values = row.values as unknown[];
        // ExcelJS usa índice 1-based; a posição 0 é sempre vazia.
        const cells = values.slice(1).map((value) => cellToString(value));
        lines.push(Papa.unparse([cells]));
      }
      break; // apenas a primeira planilha no MVP
    }

    return new TextEncoder().encode(lines.join("\r\n"));
  }
}
