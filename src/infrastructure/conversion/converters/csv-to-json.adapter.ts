import Papa from "papaparse";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";

/**
 * `.csv` → `.json`. Usa a primeira linha como cabeçalho (chaves) e produz um array
 * de objetos. `dynamicTyping` converte números/booleanos; saída identada.
 */
export class CsvToJsonAdapter implements FileConverterPort {
  readonly from = "csv" as const;
  readonly to = "json" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const csv = new TextDecoder("utf-8").decode(bytes);
    const parsed = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: "greedy",
    });
    return new TextEncoder().encode(JSON.stringify(parsed.data, null, 2));
  }
}
