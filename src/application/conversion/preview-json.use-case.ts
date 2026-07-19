import type { JsonPreview, JsonReaderPort } from "@/domain/conversion/ports/json-reader.port";

export interface PreviewJsonInput {
  readonly bytes: Uint8Array;
}

/** Lê metadados e amostra formatada de um JSON via JsonReaderPort. */
export class PreviewJsonUseCase {
  constructor(private readonly reader: JsonReaderPort) {}

  execute(input: PreviewJsonInput): Promise<JsonPreview> {
    return this.reader.read(input.bytes);
  }
}
