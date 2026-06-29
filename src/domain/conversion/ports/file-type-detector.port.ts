/** Invariante: isBinary é true sempre que signature for não-nulo. */
export interface FileTypeDetection {
  /** true quando o conteúdo parece binário (ex.: contém byte NUL). */
  readonly isBinary: boolean;
  /** Assinatura de formato binário conhecido detectada (ex.: "zip", "pdf"), se houver. */
  readonly signature: string | null;
}

/** Detecta o tipo real de um arquivo a partir dos primeiros bytes (não confia na extensão). */
export interface FileTypeDetectorPort {
  detect(bytes: Uint8Array): FileTypeDetection;
}
