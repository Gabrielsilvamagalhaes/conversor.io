import { describe, expect, it, vi } from "vitest";
import type { JsonReaderPort } from "@/domain/conversion/ports/json-reader.port";
import { PreviewJsonUseCase } from "./preview-json.use-case";

describe("PreviewJsonUseCase", () => {
  it("delega a leitura ao JsonReaderPort", async () => {
    const preview = {
      rootKind: "array" as const,
      itemCount: 2,
      depth: 2,
      sample: "[]",
      truncated: false,
    };
    const reader: JsonReaderPort = {
      read: vi.fn(async () => preview),
    };
    const useCase = new PreviewJsonUseCase(reader);
    const bytes = new Uint8Array([1, 2, 3]);

    const result = await useCase.execute({ bytes });

    expect(reader.read).toHaveBeenCalledWith(bytes);
    expect(result).toEqual(preview);
  });
});
