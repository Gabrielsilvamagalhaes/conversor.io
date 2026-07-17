import { type NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import { targetFor } from "@/domain/conversion/value-objects/conversion-pair";

export const runtime = "nodejs";

/** Valida o upload e devolve metadados + amostra das primeiras linhas. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const container = getContainer();

  try {
    const validated = container.validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });
    const preview = await container.previewSpreadsheet.execute({
      extension: validated.extension,
      bytes,
    });

    return NextResponse.json(
      {
        fileName: validated.fileName,
        extension: validated.extension,
        target: targetFor(validated.extension),
        sizeBytes: file.size,
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        totalRows: preview.totalRows,
        columns: preview.columns,
        previewRows: preview.previewRows,
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof EmptyFileError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidFileTypeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Falha ao ler o arquivo." }, { status: 500 });
  }
}
