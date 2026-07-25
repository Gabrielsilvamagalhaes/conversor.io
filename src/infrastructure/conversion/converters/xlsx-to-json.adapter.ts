import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { cellToString } from "@/infrastructure/conversion/spreadsheet/cell-value";

type JsonPrimitive = string | number | boolean | null;

/** Mesma heurística de número usada pelo `dynamicTyping` do papaparse (ver CsvToJsonAdapter). */
const NUMBER_PATTERN = /^\s*-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/;

/**
 * `.xlsx` → `.json`. Lê a primeira planilha em streaming (`WorkbookReader`, linha a linha),
 * usa a primeira linha como cabeçalho e monta o JSON incrementalmente — cada linha vira um
 * fragmento de string já indentado, sem manter um array de objetos com a planilha inteira
 * em memória de uma vez.
 */
export class XlsxToJsonAdapter implements FileConverterPort {
  readonly from = "xlsx" as const;
  readonly to = "json" as const;

  async convert(bytes: Uint8Array): Promise<Uint8Array> {
    const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(Buffer.from(bytes)), {});
    const pieces: string[] = [];
    let headerKeys: string[] | null = null;

    for await (const worksheet of reader) {
      for await (const row of worksheet) {
        const values = row.values as unknown[];
        // ExcelJS usa índice 1-based; a posição 0 é sempre vazia.
        const cells = values.slice(1).map((value) => cellToString(value));

        if (headerKeys === null) {
          headerKeys = buildHeaderKeys(cells);
          continue;
        }

        const record: Record<string, JsonPrimitive> = {};
        headerKeys.forEach((key, index) => {
          record[key] = coerceValue(cells[index] ?? "");
        });
        pieces.push(indentObject(JSON.stringify(record, null, 2)));
      }
      break; // apenas a primeira planilha no MVP
    }

    const json = pieces.length > 0 ? `[\n${pieces.join(",\n")}\n]` : "[]";
    return new TextEncoder().encode(json);
  }
}

/**
 * Gera as chaves do objeto a partir da linha de cabeçalho. Célula vazia vira `coluna_N`
 * (N = posição 1-based); nome repetido ganha sufixo `_N` (N = nº da ocorrência) em vez de
 * sobrescrever a chave anterior.
 */
function buildHeaderKeys(headerCells: string[]): string[] {
  const seen = new Map<string, number>();
  return headerCells.map((raw, index) => {
    const base = raw.trim().length > 0 ? raw.trim() : `coluna_${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

/** número → number · "true"/"false" → boolean · vazio → null · resto → string. */
function coerceValue(raw: string): JsonPrimitive {
  if (raw === "") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (NUMBER_PATTERN.test(raw)) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return raw;
}

/** Reindenta um `JSON.stringify(obj, null, 2)` para o nível de item de array (2 espaços a mais). */
function indentObject(json: string): string {
  return json
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
