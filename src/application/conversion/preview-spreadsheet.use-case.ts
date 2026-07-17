import type {
  SpreadsheetPreview,
  SpreadsheetReaderPort,
} from "@/domain/conversion/ports/spreadsheet-reader.port";
import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";

export interface PreviewSpreadsheetInput {
  readonly extension: AcceptedExtension;
  readonly bytes: Uint8Array;
}

/** Lê metadados e amostra de linhas de uma planilha via SpreadsheetReaderPort. */
export class PreviewSpreadsheetUseCase {
  constructor(private readonly reader: SpreadsheetReaderPort) {}

  execute(input: PreviewSpreadsheetInput): Promise<SpreadsheetPreview> {
    return this.reader.read(input.bytes, input.extension);
  }
}
