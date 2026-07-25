import { z } from "zod";
import { isClientConvertiblePair } from "@/domain/conversion/value-objects/conversion-pair";
import { MAX_VIDEO_SIZE_BYTES } from "@/shared/constants/upload";

/**
 * Contrato de `POST /api/conversions`: o client (ffmpeg.wasm, vídeo → áudio) reporta uma
 * conversão que já rodou no navegador. A entrada é inteiramente não confiável — validamos
 * tipos e faixas de valor, e `isClientConvertiblePair` garante que só pares de mídia
 * `live`/`engine: "client"` do catálogo entram no histórico (impede injetar no histórico
 * um par server-side, ou um par inexistente, que nunca de fato rodou).
 *
 * Extraído para módulo próprio (sem depender de `NextRequest`/rota) para poder ser
 * testado isoladamente.
 */
export const recordConversionSchema = z
  .object({
    fileName: z.string().min(1, "fileName é obrigatório.").max(255, "fileName muito longo."),
    from: z.string().min(1, "from é obrigatório."),
    to: z.string().min(1, "to é obrigatório."),
    sizeBytes: z
      .number()
      .int("sizeBytes deve ser inteiro.")
      .min(1, "sizeBytes deve ser positivo.")
      .max(MAX_VIDEO_SIZE_BYTES, "sizeBytes acima do limite de vídeo."),
    outputSizeBytes: z
      .number()
      .int("outputSizeBytes deve ser inteiro.")
      .min(0, "outputSizeBytes não pode ser negativo."),
    durationMs: z
      .number()
      .int("durationMs deve ser inteiro.")
      .min(0, "durationMs não pode ser negativo.")
      .max(3_600_000, "durationMs acima do limite de 1 hora."),
    status: z.enum(["completed", "failed"]),
    errorCode: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isClientConvertiblePair(data.from, data.to)) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: `Par de conversão "${data.from} → ${data.to}" não é convertível no navegador.`,
      });
    }
    if (data.status === "failed" && !data.errorCode) {
      ctx.addIssue({
        code: "custom",
        path: ["errorCode"],
        message: 'errorCode é obrigatório quando status é "failed".',
      });
    }
  });

export type RecordConversionRequest = z.infer<typeof recordConversionSchema>;
