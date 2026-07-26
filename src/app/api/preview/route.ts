import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { buildRequestContext, elapsedMs, REQUEST_ID_HEADER } from "@/app/api/_lib/request-context";
import { requireSession } from "@/app/api/_lib/require-session";
import { getContainer } from "@/di/container";
import {
  type ConversionCategory,
  liveTargetsFor,
} from "@/domain/conversion/value-objects/conversion-pair";
import { hashFileName } from "@/infrastructure/observability/redact";

export const runtime = "nodejs";

// Mídia não passa por aqui: o vídeo é lido e convertido no navegador (ffmpeg.wasm).
// `images` não tem reader de amostra server-side (sem preview textual); os campos de
// amostra ficam `null` e o cliente monta a pré-visualização com um object URL local.
const CATEGORIES: readonly ConversionCategory[] = ["spreadsheets", "data", "documents", "images"];
// Só planilhas passam pelo `previewSpreadsheet` — pdf/json/docx têm seu próprio reader
// e condição dedicada abaixo (não fazem parte deste conjunto).
const SPREADSHEET_EXTENSIONS = new Set(["csv", "xlsx"]);

function isCategory(value: unknown): value is ConversionCategory {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Valida o upload e devolve metadados + destinos ativos (+ amostra, se houver reader). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { requestId, clientIp } = buildRequestContext(request);
  const baseLog = getContainer().logger.child({ service: "api-gateway", requestId, clientIp });

  try {
    const user = await requireSession();
    const log = baseLog.child({ userId: user.uid });

    const form = await request.formData();
    const file = form.get("file");
    const category = form.get("category");

    if (!(file instanceof File)) {
      const response = NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
    if (!isCategory(category)) {
      const response = NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }

    log.info({
      event: "file_preview_started",
      context: {
        fileNameHash: hashFileName(file.name),
        extension: extensionOf(file.name),
        sizeBytes: file.size,
      },
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const container = getContainer();

    const validated = container.validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });

    const targets = liveTargetsFor(validated.extension, category);
    const spreadsheet = SPREADSHEET_EXTENSIONS.has(validated.extension)
      ? await container.previewSpreadsheet.execute({ extension: validated.extension, bytes })
      : null;
    const pdf =
      validated.extension === "pdf" ? await container.previewPdf.execute({ bytes }) : null;
    const json =
      validated.extension === "json" ? await container.previewJson.execute({ bytes }) : null;
    const docx =
      validated.extension === "docx" ? await container.previewDocx.execute({ bytes }) : null;

    log.info({
      event: "file_preview_succeeded",
      status: 200,
      durationMs: elapsedMs(startedAt),
    });

    const response = NextResponse.json(
      {
        fileName: validated.fileName,
        extension: validated.extension,
        targets,
        sizeBytes: file.size,
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        totalRows: spreadsheet?.totalRows ?? null,
        columns: spreadsheet?.columns ?? null,
        previewRows: spreadsheet?.previewRows ?? null,
        pageCount: pdf?.pageCount ?? null,
        pdfText: pdf?.textSample ?? null,
        jsonRootKind: json?.rootKind ?? null,
        jsonItemCount: json?.itemCount ?? null,
        jsonDepth: json?.depth ?? null,
        jsonSample: json?.sample ?? null,
        jsonTruncated: json?.truncated ?? null,
        docx,
      },
      { status: 200 },
    );
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch (error) {
    const response = toErrorResponse(error, "Falha ao ler o arquivo.", baseLog);
    baseLog.warn({
      event: "file_preview_failed",
      status: response.status,
      durationMs: elapsedMs(startedAt),
      error,
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }
}
