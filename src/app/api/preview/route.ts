import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { getContainer } from "@/di/container";
import {
  type ConversionCategory,
  liveTargetsFor,
} from "@/domain/conversion/value-objects/conversion-pair";

export const runtime = "nodejs";

// Mídia não passa por aqui: o vídeo é lido e convertido no navegador (ffmpeg.wasm).
const CATEGORIES: readonly ConversionCategory[] = ["spreadsheets", "data", "documents"];
const PREVIEWABLE = new Set(["csv", "xlsx"]);

function isCategory(value: unknown): value is ConversionCategory {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** Valida o upload e devolve metadados + destinos ativos (+ amostra, se for planilha). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get("file");
  const category = form.get("category");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const container = getContainer();

  try {
    const validated = container.validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });

    const targets = liveTargetsFor(validated.extension, category);
    const spreadsheet = PREVIEWABLE.has(validated.extension)
      ? await container.previewSpreadsheet.execute({ extension: validated.extension, bytes })
      : null;
    const pdf =
      validated.extension === "pdf" ? await container.previewPdf.execute({ bytes }) : null;
    const json =
      validated.extension === "json" ? await container.previewJson.execute({ bytes }) : null;

    return NextResponse.json(
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
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "Falha ao ler o arquivo.");
  }
}
