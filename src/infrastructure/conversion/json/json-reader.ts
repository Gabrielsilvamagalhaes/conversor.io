import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { JsonPreview, JsonReaderPort } from "@/domain/conversion/ports/json-reader.port";
import { MAX_JSON_SAMPLE } from "@/shared/constants/upload";

/** Lê um JSON, valida a sintaxe e deriva metadados + amostra formatada. */
export class JsonReader implements JsonReaderPort {
  async read(bytes: Uint8Array): Promise<JsonPreview> {
    const text = new TextDecoder("utf-8").decode(bytes);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new InvalidFileTypeError("JSON inválido");
    }

    const pretty = JSON.stringify(parsed, null, 2) ?? String(parsed);
    const truncated = pretty.length > MAX_JSON_SAMPLE;

    return {
      rootKind: rootKindOf(parsed),
      itemCount: itemCountOf(parsed),
      depth: depthOf(parsed),
      sample: truncated ? pretty.slice(0, MAX_JSON_SAMPLE) : pretty,
      truncated,
    };
  }
}

function rootKindOf(value: unknown): JsonPreview["rootKind"] {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return "primitive";
}

function itemCountOf(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === "object") return Object.keys(value).length;
  return null;
}

/** Profundidade máxima de aninhamento; primitivo/vazio = 1. */
function depthOf(value: unknown): number {
  if (value === null || typeof value !== "object") return 1;
  const children = Array.isArray(value) ? value : Object.values(value);
  let max = 0;
  for (const child of children) {
    const d = depthOf(child);
    if (d > max) max = d;
  }
  return max + 1;
}
