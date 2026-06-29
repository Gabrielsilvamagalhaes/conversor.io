import { type NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const result = getContainer().validateUpload.execute({
      fileName: file.name,
      size: file.size,
      bytes,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (
      error instanceof EmptyFileError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidFileTypeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Falha ao validar o upload." }, { status: 500 });
  }
}
