/**
 * Extensões aceitas no catálogo.
 * Planilhas: `.csv`, `.xlsx` · Dados: `.json`, `.csv` · Documentos: `.pdf`, `.docx`, `.txt`.
 * `.txt` é apenas destino (saída de `pdf → txt`), nunca origem de upload.
 */
export const ACCEPTED_EXTENSIONS = ["csv", "xlsx", "json", "pdf", "docx", "txt"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function isAcceptedExtension(extension: string): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}
