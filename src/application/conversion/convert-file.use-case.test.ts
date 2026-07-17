import { describe, expect, it, vi } from "vitest";
import { ConverterRegistry } from "@/application/conversion/services/converter-registry";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import { ConvertFileUseCase } from "./convert-file.use-case";

function fakeConverter(
  from: AcceptedExtension,
  to: AcceptedExtension,
  out: Uint8Array,
): FileConverterPort {
  return { from, to, convert: vi.fn(async () => out) };
}

describe("ConvertFileUseCase", () => {
  it("converte usando o adapter do par e renomeia a saída", async () => {
    const out = new TextEncoder().encode("planilha");
    const registry = new ConverterRegistry([fakeConverter("csv", "xlsx", out)]);
    const useCase = new ConvertFileUseCase(registry);

    const result = await useCase.execute({
      fileName: "dados.csv",
      target: "xlsx",
      bytes: new Uint8Array([1]),
    });

    expect(result.fileName).toBe("dados.xlsx");
    expect(result.bytes).toBe(out);
  });

  it("rejeita par fora do catálogo", async () => {
    const useCase = new ConvertFileUseCase(new ConverterRegistry());
    await expect(
      useCase.execute({ fileName: "a.csv", target: "csv", bytes: new Uint8Array() }),
    ).rejects.toBeInstanceOf(UnsupportedConversionError);
  });

  it("rejeita par suportado sem adapter registrado", async () => {
    const useCase = new ConvertFileUseCase(new ConverterRegistry());
    await expect(
      useCase.execute({ fileName: "a.csv", target: "xlsx", bytes: new Uint8Array() }),
    ).rejects.toBeInstanceOf(UnsupportedConversionError);
  });
});
