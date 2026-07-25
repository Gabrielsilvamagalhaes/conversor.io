import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { requireSession } from "@/app/api/_lib/require-session";
import { recordConversionSchema } from "@/app/api/conversions/record-conversion.schema";
import { getContainer } from "@/di/container";
import {
  CONVERSION_PAIRS,
  type ConversionPair,
} from "@/domain/conversion/value-objects/conversion-pair";
import { FileName } from "@/domain/conversion/value-objects/file-name";
import { hashFileName } from "@/infrastructure/observability/redact";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 60;
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

/** Par de mídia `live`/`engine: "client"` do catálogo, ou `null`. */
function resolveClientPair(from: string, to: string): ConversionPair | null {
  return (
    CONVERSION_PAIRS.find(
      (pair) => pair.live && pair.engine === "client" && pair.from === from && pair.to === to,
    ) ?? null
  );
}

function clampLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsed));
}

/**
 * Registra no histórico uma conversão de mídia já executada no navegador (ffmpeg.wasm).
 * A entrada é inteiramente não confiável: schema zod (`recordConversionSchema`) valida
 * tipos/faixas e que o par é convertível no client; rate limit simples (60/h) evita abuso.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const baseLog = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  try {
    const user = await requireSession();
    const log = baseLog.child({ userId: user.uid });
    const container = getContainer();

    const rawBody = await request.json().catch(() => null);
    const parsed = recordConversionSchema.safeParse(rawBody);
    if (!parsed.success) {
      const response = NextResponse.json(
        { error: "Payload inválido para registrar a conversão." },
        { status: 400 },
      );
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
    const body = parsed.data;

    // Defensivo: o schema já valida `isClientConvertiblePair`, mas resolvemos o par de
    // novo aqui para tipar `from`/`to` como `AcceptedExtension` sem cast.
    const pair = resolveClientPair(body.from, body.to);
    if (!pair) {
      const response = NextResponse.json(
        { error: "Payload inválido para registrar a conversão." },
        { status: 400 },
      );
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }

    log.info({
      event: "conversion_record_started",
      context: {
        fileNameHash: hashFileName(body.fileName),
        extension: pair.from,
        target: pair.to,
        sizeBytes: body.sizeBytes,
      },
    });

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await container.countConversionsSince.execute({
      userId: user.uid,
      since,
    });
    if (recentCount >= RATE_LIMIT_MAX) {
      log.warn({
        event: "conversion_record_rate_limited",
        status: 429,
        context: { recentCount },
      });
      const response = NextResponse.json(
        { error: "Muitas conversões registradas na última hora. Tente novamente mais tarde." },
        { status: 429 },
      );
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }

    const sanitizedFileName = FileName.sanitizeBase(body.fileName);

    await container.recordConversion.execute(
      body.status === "completed"
        ? {
            userId: user.uid,
            fileName: sanitizedFileName,
            from: pair.from,
            to: pair.to,
            category: pair.category,
            engine: "client",
            sizeBytes: body.sizeBytes,
            durationMs: body.durationMs,
            status: "completed",
            outputSizeBytes: body.outputSizeBytes,
          }
        : {
            userId: user.uid,
            fileName: sanitizedFileName,
            from: pair.from,
            to: pair.to,
            category: pair.category,
            engine: "client",
            sizeBytes: body.sizeBytes,
            durationMs: body.durationMs,
            status: "failed",
            errorCode: body.errorCode ?? "UnknownError",
          },
    );

    log.info({
      event: "conversion_record_succeeded",
      status: 201,
      durationMs: elapsedMs(startedAt),
    });

    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch (error) {
    const response = toErrorResponse(error, "Falha ao registrar a conversão.", baseLog);
    baseLog.warn({
      event: "conversion_record_failed",
      status: response.status,
      durationMs: elapsedMs(startedAt),
      error,
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}

/** Lista o histórico de conversões do usuário autenticado, paginado. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const baseLog = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  try {
    const user = await requireSession();
    const log = baseLog.child({ userId: user.uid });

    const { searchParams } = new URL(request.url);
    const limit = clampLimit(searchParams.get("limit"));
    const cursor = searchParams.get("cursor") ?? undefined;

    const history = await getContainer().listConversions.execute({
      userId: user.uid,
      limit,
      cursor,
    });

    log.info({
      event: "conversion_history_listed",
      status: 200,
      durationMs: elapsedMs(startedAt),
      context: { count: history.items.length, limit },
    });

    const response = NextResponse.json(history, { status: 200 });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch (error) {
    const response = toErrorResponse(error, "Falha ao listar o histórico de conversões.", baseLog);
    baseLog.warn({
      event: "conversion_history_list_failed",
      status: response.status,
      durationMs: elapsedMs(startedAt),
      error,
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}
