/** Metadados de pré-visualização de um JSON. */
export interface JsonPreview {
  /** Tipo do valor raiz do documento. */
  readonly rootKind: "array" | "object" | "primitive";
  /** Nº de itens (array) ou de chaves (objeto); `null` para primitivo. */
  readonly itemCount: number | null;
  /** Profundidade máxima de aninhamento (raiz = 1). */
  readonly depth: number;
  /** Amostra pretty-printed (indentada), truncada a MAX_JSON_SAMPLE caracteres. */
  readonly sample: string;
  /** `true` quando a amostra foi cortada por exceder o limite. */
  readonly truncated: boolean;
}

/** Lê metadados e uma amostra formatada de um JSON. */
export interface JsonReaderPort {
  read(bytes: Uint8Array): Promise<JsonPreview>;
}
