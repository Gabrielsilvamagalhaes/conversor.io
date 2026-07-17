/**
 * Normaliza um valor de célula do ExcelJS para string. Cobre datas, fórmulas
 * (resultado), hyperlinks e rich text, além de primitivos.
 */
export function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    const cell = value as Record<string, unknown>;
    if (Array.isArray(cell.richText)) {
      return (cell.richText as { text?: string }[]).map((run) => run.text ?? "").join("");
    }
    if ("result" in cell) return cellToString(cell.result);
    if ("text" in cell) return String(cell.text);
    if ("hyperlink" in cell) return String(cell.hyperlink);
    return String(value);
  }

  return String(value);
}
