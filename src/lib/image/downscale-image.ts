"use client";

/** MIME de saída por extensão de origem. Recodificar em outro formato quebraria a validação de
 * magic bytes do servidor, que compara a assinatura com a extensão do nome do arquivo. */
const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Tentativas em ordem crescente de agressividade. `quality` só afeta jpeg/webp — em png o
 * `toBlob` ignora o parâmetro, então lá quem reduz o peso é a escala.
 */
const ATTEMPTS: readonly { scale: number; quality: number }[] = [
  { scale: 1, quality: 0.85 },
  { scale: 0.8, quality: 0.8 },
  { scale: 0.65, quality: 0.78 },
  { scale: 0.5, quality: 0.75 },
  { scale: 0.35, quality: 0.72 },
  { scale: 0.25, quality: 0.7 },
];

export interface DownscaleResult {
  /** O arquivo a enviar: o original, se já cabia, ou a versão reduzida. */
  readonly file: File;
  readonly wasResized: boolean;
  readonly originalBytes: number;
}

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mime, quality);
  });
}

/**
 * Reduz uma imagem no navegador até caber no limite de upload, preservando o formato de origem.
 *
 * O teto de 4 MB vem do tamanho máximo de body da plataforma, e foto de celular passa disso com
 * folga — justamente o arquivo que o usuário mais quer converter. Em vez de rejeitar, reduzimos
 * dimensão e qualidade progressivamente até caber. Se nem a tentativa mais agressiva couber, o
 * arquivo original é devolvido e o erro do servidor segue valendo.
 */
export async function downscaleImageToFit(file: File, maxBytes: number): Promise<DownscaleResult> {
  const originalBytes = file.size;
  const mime = MIME_BY_EXTENSION[extensionOf(file.name)];

  if (file.size <= maxBytes || !mime) {
    return { file, wasResized: false, originalBytes };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Arquivo ilegível como imagem: deixa a validação de magic bytes do servidor recusar,
    // com uma mensagem melhor do que qualquer coisa que pudéssemos inventar aqui.
    return { file, wasResized: false, originalBytes };
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return { file, wasResized: false, originalBytes };

    for (const attempt of ATTEMPTS) {
      canvas.width = Math.max(1, Math.round(bitmap.width * attempt.scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * attempt.scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await toBlob(canvas, mime, attempt.quality);
      if (blob && blob.size <= maxBytes) {
        return {
          file: new File([blob], file.name, { type: mime, lastModified: file.lastModified }),
          wasResized: true,
          originalBytes,
        };
      }
    }

    return { file, wasResized: false, originalBytes };
  } finally {
    bitmap.close();
  }
}
