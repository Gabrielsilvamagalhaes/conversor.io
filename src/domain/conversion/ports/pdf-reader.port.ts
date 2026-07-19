/** Metadados de pré-visualização de um PDF. */
export interface PdfPreview {
  /** Número total de páginas do documento. */
  readonly pageCount: number;
  /** Amostra de texto (fallback quando a renderização da página falha no client). */
  readonly textSample: string;
}

/** Lê metadados e uma amostra de texto de um PDF sem renderizar páginas. */
export interface PdfReaderPort {
  read(bytes: Uint8Array): Promise<PdfPreview>;
}
