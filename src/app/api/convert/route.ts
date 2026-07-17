import { type NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import { UnsupportedConversionError } from "@/domain/conversion/errors/unsupported-conversion.error";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** Valida o upload, converte para o formato de destino e devolve para download. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get("file");
  const target = form.get("target");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (typeof target !== "string") {
    return NextResponse.json({ error: "Formato de destino ausente." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const container = getContainer();

  try {
    // Revalida no servidor antes de converter (segurança).
    container.validateUpload.execute({ fileName: file.name, size: file.size, bytes });
    const result = await container.convertFile.execute({
      fileName: file.name,
      target,
      bytes,
    });

    // Cast: TS 5.7 tipa Uint8Array como genérico sobre ArrayBufferLike; o corpo aceita os bytes.
    return new NextResponse(new Blob([result.bytes as BlobPart]), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[target.toLowerCase()] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    if (
      error instanceof EmptyFileError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidFileTypeError ||
      error instanceof UnsupportedConversionError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Falha ao converter o arquivo." }, { status: 500 });
  }
}
