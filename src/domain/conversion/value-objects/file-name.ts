/**
 * Nome de arquivo sanitizado. Remove diretórios (anti path traversal) e
 * caracteres perigosos; expõe a extensão normalizada em minúsculas.
 */
export class FileName {
  private constructor(
    readonly value: string,
    readonly extension: string,
  ) {}

  static create(raw: string): FileName {
    const base = raw.split(/[/\\]/).pop() ?? "";
    if (base.trim().length === 0) {
      throw new Error("Nome de arquivo inválido.");
    }
    const sanitized = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
    if (sanitized.trim().length === 0 || sanitized === ".") {
      throw new Error("Nome de arquivo inválido.");
    }
    const dot = sanitized.lastIndexOf(".");
    const extension = dot > 0 ? sanitized.slice(dot + 1).toLowerCase() : "";
    return new FileName(sanitized, extension);
  }
}
