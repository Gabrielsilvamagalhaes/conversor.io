import { PassThrough } from "node:stream";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";

/**
 * `.csv` → `.xlsx`. Faz parse do CSV linha a linha (papaparse `step`) e escreve
 * cada linha via WorkbookWriter em streaming — não segura a planilha inteira em
 * memória de uma vez.
 */
export class CsvToXlsxAdapter implements FileConverterPort {
  readonly from = "csv" as const;
  readonly to = "xlsx" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const csv = new TextDecoder("utf-8").decode(bytes);

    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    const drained = new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });
    const sheet = workbook.addWorksheet("Planilha1");

    Papa.parse<string[]>(csv, {
      skipEmptyLines: "greedy",
      step: (result) => {
        sheet.addRow(result.data).commit();
      },
    });

    await workbook.commit();
    await drained;
    return new Uint8Array(Buffer.concat(chunks));
  }
}
