import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { getContainer } from "@/di/container";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

/** Valida o upload, converte para o formato de destino e devolve para download. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const file = form.get("file");
  const target = form.get("target");
  const outputName = form.get("outputName");

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
      outputBaseName: typeof outputName === "string" && outputName.trim() ? outputName : undefined,
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
    return toErrorResponse(error, "Falha ao converter o arquivo.");
  }
}
