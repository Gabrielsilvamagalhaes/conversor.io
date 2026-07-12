/** Extensões aceitas no MVP (apenas `.csv` nesta fase). */
export const ACCEPTED_EXTENSIONS = ["csv"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function isAcceptedExtension(extension: string): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}
