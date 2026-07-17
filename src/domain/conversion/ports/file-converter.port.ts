import type { AcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";

/**
 * Converte os bytes de um formato de origem para um de destino.
 * Um adapter por par de conversão, registrado no ConverterRegistry.
 */
export interface FileConverterPort {
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  convert(bytes: Uint8Array): Promise<Uint8Array>;
}
