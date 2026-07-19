import Papa from "papaparse";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";

/**
 * `.json` → `.csv`. Espera um array de objetos; um objeto raiz é embrulhado em `[obj]`.
 * Objetos aninhados são achatados de forma rasa pelo papaparse (limitação do MVP).
 */
export class JsonToCsvAdapter implements FileConverterPort {
  readonly from = "json" as const;
  readonly to = "csv" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const text = new TextDecoder("utf-8").decode(bytes);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new InvalidFileTypeError("JSON inválido");
    }

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const csv = Papa.unparse(rows);
    return new TextEncoder().encode(csv);
  }
}
