/** Metadados de pré-visualização de um `.docx`. */
export interface DocxPreview {
  /** Total de palavras extraídas do texto bruto do documento. */
  readonly wordCount: number;
  /** Total de parágrafos não vazios. */
  readonly paragraphCount: number;
  /** Amostra de texto (fallback quando a renderização não está disponível no client). */
  readonly textSample: string;
  /** Indica se `textSample` foi cortada em `MAX_DOCX_TEXT_SAMPLE`. */
  readonly truncated: boolean;
}

/** Lê metadados e uma amostra de texto de um `.docx` sem renderizar o documento inteiro. */
export interface DocxReaderPort {
  read(bytes: Uint8Array): Promise<DocxPreview>;
}
