import { describe, expect, it } from "vitest";
import type {
  SpreadsheetPreview,
  SpreadsheetReaderPort,
} from "@/domain/conversion/ports/spreadsheet-reader.port";
import { PreviewSpreadsheetUseCase } from "./preview-spreadsheet.use-case";

function readerReturning(preview: SpreadsheetPreview): SpreadsheetReaderPort {
  return { read: () => Promise.resolve(preview) };
}

describe("PreviewSpreadsheetUseCase", () => {
  it("repassa o resultado do reader", async () => {
    const previewRows = Array.from({ length: 10 }, (_, i) => [String(i)]);
    const useCase = new PreviewSpreadsheetUseCase(
      readerReturning({ totalRows: 42, columns: 1, previewRows }),
    );

    const result = await useCase.execute({ extension: "csv", bytes: new Uint8Array() });

    expect(result.totalRows).toBe(42);
    expect(result.previewRows).toHaveLength(10);
  });

  it("arquivo com menos de 10 linhas mostra só as existentes", async () => {
    const useCase = new PreviewSpreadsheetUseCase(
      readerReturning({
        totalRows: 3,
        columns: 2,
        previewRows: [
          ["a", "b"],
          ["1", "2"],
          ["3", "4"],
        ],
      }),
    );

    const result = await useCase.execute({ extension: "csv", bytes: new Uint8Array() });

    expect(result.previewRows).toHaveLength(3);
  });
});
