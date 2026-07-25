/**
 * `mammoth` não publica tipos próprios nem tem pacote `@types` oficial. Declaração mínima
 * cobrindo apenas a API usada neste projeto (`convertToHtml` e `extractRawText`).
 */
declare module "mammoth" {
  export interface MammothMessage {
    readonly type: "warning" | "error";
    readonly message: string;
  }

  export interface MammothResult {
    readonly value: string;
    readonly messages: readonly MammothMessage[];
  }

  export interface MammothInput {
    readonly buffer?: Buffer;
    readonly path?: string;
  }

  export function convertToHtml(input: MammothInput): Promise<MammothResult>;
  export function extractRawText(input: MammothInput): Promise<MammothResult>;
}
