import { type NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/app/api/_lib/error-response";
import { getContainer } from "@/di/container";

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
    return toErrorResponse(error, "Falha ao validar o upload.");
  }
}
