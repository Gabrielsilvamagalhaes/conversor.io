import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";

/** Registra os adapters de conversão e os resolve por par (from→to). */
export class ConverterRegistry {
  private readonly converters = new Map<string, FileConverterPort>();

  constructor(converters: readonly FileConverterPort[] = []) {
    for (const converter of converters) this.register(converter);
  }

  register(converter: FileConverterPort): void {
    this.converters.set(ConverterRegistry.key(converter.from, converter.to), converter);
  }

  resolve(from: string, to: string): FileConverterPort | null {
    return this.converters.get(ConverterRegistry.key(from, to)) ?? null;
  }

  private static key(from: string, to: string): string {
    return `${from}->${to}`;
  }
}
