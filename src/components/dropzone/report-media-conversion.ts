import { isClientConvertiblePair } from "@/domain/conversion/value-objects/conversion-pair";

export interface MediaConversionReportInput {
  readonly fileName: string;
  readonly from: string;
  readonly to: string;
  readonly sizeBytes: number;
  readonly outputSizeBytes: number;
  readonly durationMs: number;
}

export interface MediaConversionReportPayload {
  readonly fileName: string;
  readonly from: string;
  readonly to: string;
  readonly sizeBytes: number;
  readonly outputSizeBytes: number;
  readonly durationMs: number;
  readonly status: "completed";
}

/**
 * Monta o payload de `POST /api/conversions` a partir de uma conversão de mídia concluída
 * no navegador. Devolve `null` quando o par não é convertível no client — nunca reporta um
 * par server-side (aquele já é registrado pela própria rota `/api/convert`).
 */
export function buildMediaConversionReport(
  input: MediaConversionReportInput,
): MediaConversionReportPayload | null {
  if (!isClientConvertiblePair(input.from, input.to)) return null;
  return { ...input, status: "completed" };
}

/**
 * Reporta ao histórico uma conversão de mídia (vídeo → áudio) já concluída no navegador.
 * Best-effort: nunca lança, nunca bloqueia o download — a conversão do usuário já deu
 * certo, o registro no histórico é secundário. Falhas (rede, 401, 429, 500) só geram
 * `console.debug`, nunca um toast de erro.
 */
export async function reportMediaConversion(input: MediaConversionReportInput): Promise<void> {
  const payload = buildMediaConversionReport(input);
  if (!payload) return;

  try {
    const res = await fetch("/api/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.debug(
        `[conversions] falha ao registrar conversão no histórico (status ${res.status})`,
      );
    }
  } catch (error) {
    console.debug("[conversions] falha de rede ao registrar conversão no histórico", error);
  }
}
