/** Extensões aceitas no MVP (planilhas: `.csv` e `.xlsx`). */
export const ACCEPTED_EXTENSIONS = ["csv", "xlsx"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function isAcceptedExtension(extension: string): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}
