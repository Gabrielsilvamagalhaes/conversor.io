import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { requireSession } from "@/app/api/_lib/require-session";
import { getContainer } from "@/di/container";
import {
  CONVERSION_PAIRS,
  type ConversionPair,
} from "@/domain/conversion/value-objects/conversion-pair";
import { hashFileName } from "@/infrastructure/observability/redact";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Par (com categoria) do catálogo para `from`→`to`, ou `null` se não existir. */
function resolvePair(from: string, to: string): ConversionPair | null {
  return CONVERSION_PAIRS.find((pair) => pair.from === from && pair.to === to) ?? null;
}

function errorCodeOf(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/** Valida o upload, converte para o formato de destino e devolve para download. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const baseLog = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  try {
    const user = await requireSession();
    const log = baseLog.child({ userId: user.uid });
    const container = getContainer();

    const form = await request.formData();
    const file = form.get("file");
    const target = form.get("target");
    const outputName = form.get("outputName");

    if (!(file instanceof File)) {
      const response = NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
    if (typeof target !== "string") {
      const response = NextResponse.json({ error: "Formato de destino ausente." }, { status: 400 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
    const to = target.toLowerCase();

    log.info({
      event: "conversion_started",
      context: {
        fileNameHash: hashFileName(file.name),
        extension: extensionOf(file.name),
        target: to,
        sizeBytes: file.size,
      },
    });

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Revalida no servidor antes de converter (segurança). Erro aqui é validação de
    // entrada anterior à conversão — não entra no histórico.
    const validated = container.validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });

    const conversionStartedAt = Date.now();
    try {
      const result = await container.convertFile.execute({
        fileName: file.name,
        target,
        bytes,
        outputBaseName:
          typeof outputName === "string" && outputName.trim() ? outputName : undefined,
      });
      const conversionDurationMs = elapsedMs(conversionStartedAt);

      const pair = resolvePair(validated.extension, to);
      if (pair) {
        await container.recordConversion.execute({
          userId: user.uid,
          fileName: file.name,
          from: pair.from,
          to: pair.to,
          category: pair.category,
          engine: "server",
          sizeBytes: file.size,
          durationMs: conversionDurationMs,
          status: "completed",
          outputSizeBytes: result.bytes.byteLength,
        });
      }

      log.info({
        event: "conversion_succeeded",
        status: 200,
        durationMs: elapsedMs(startedAt),
      });

      // Cast: TS 5.7 tipa Uint8Array como genérico sobre ArrayBufferLike; o corpo aceita os bytes.
      const response = new NextResponse(new Blob([result.bytes as BlobPart]), {
        status: 200,
        headers: {
          "Content-Type": CONTENT_TYPES[to] ?? "application/octet-stream",
          "Content-Disposition": `attachment; filename="${result.fileName}"`,
        },
      });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    } catch (conversionError) {
      const pair = resolvePair(validated.extension, to);
      if (pair) {
        await container.recordConversion.execute({
          userId: user.uid,
          fileName: file.name,
          from: pair.from,
          to: pair.to,
          category: pair.category,
          engine: "server",
          sizeBytes: file.size,
          durationMs: elapsedMs(conversionStartedAt),
          status: "failed",
          errorCode: errorCodeOf(conversionError),
        });
      }
      throw conversionError;
    }
  } catch (error) {
    const response = toErrorResponse(error, "Falha ao converter o arquivo.", baseLog);
    baseLog.warn({
      event: "conversion_failed",
      status: response.status,
      durationMs: elapsedMs(startedAt),
      error,
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}
