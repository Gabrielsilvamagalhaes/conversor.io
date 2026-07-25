/** Remove a extensão final de um nome de arquivo ("relatorio.csv" → "relatorio"). */
export function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

/** Sanitização client do nome-base (espelha `FileName.sanitizeBase` no servidor). */
export function sanitizeBaseName(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "";
  return base
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "");
}
