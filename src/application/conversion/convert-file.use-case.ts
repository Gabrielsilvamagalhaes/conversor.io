import type { ConverterRegistry } from "@/application/conversion/services/converter-registry";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";
import { isSupportedPair } from "@/domain/conversion/value-objects/conversion-pair";
import { FileName } from "@/domain/conversion/value-objects/file-name";

export interface ConvertFileInput {
  readonly fileName: string;
  readonly target: string;
  readonly bytes: Uint8Array;
}

export interface ConvertedFile {
  readonly fileName: string;
  readonly bytes: Uint8Array;
}

/**
 * Converte um arquivo para o formato de destino: valida o par no catálogo,
 * resolve o adapter no registry e devolve os bytes + nome de saída.
 */
export class ConvertFileUseCase {
  constructor(private readonly registry: ConverterRegistry) {}

  async execute(input: ConvertFileInput): Promise<ConvertedFile> {
    const name = FileName.create(input.fileName);
    const from = name.extension;
    const to = input.target.toLowerCase();

    if (!isSupportedPair(from, to)) throw new UnsupportedConversionError(from, to);
    const converter = this.registry.resolve(from, to);
    if (!converter) throw new UnsupportedConversionError(from, to);

    const bytes = await converter.convert(input.bytes);
    const base = name.value.replace(/\.[^.]+$/, "");
    return { fileName: `${base}.${to}`, bytes };
  }
}
