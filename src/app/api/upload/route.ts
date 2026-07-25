import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { requireSession } from "@/app/api/_lib/require-session";
import { getContainer } from "@/di/container";
import { hashFileName } from "@/infrastructure/observability/redact";

export const runtime = "nodejs";

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const baseLog = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  try {
    const user = await requireSession();
    const log = baseLog.child({ userId: user.uid });

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      const response = NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }

    log.info({
      event: "upload_validation_started",
      context: {
        fileNameHash: hashFileName(file.name),
        extension: extensionOf(file.name),
        sizeBytes: file.size,
      },
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = getContainer().validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });

    log.info({
      event: "upload_validation_succeeded",
      status: 200,
      durationMs: elapsedMs(startedAt),
    });

    const response = NextResponse.json(result, { status: 200 });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch (error) {
    const response = toErrorResponse(error, "Falha ao validar o upload.", baseLog);
    baseLog.warn({
      event: "upload_validation_failed",
      status: response.status,
      durationMs: elapsedMs(startedAt),
      error,
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}
