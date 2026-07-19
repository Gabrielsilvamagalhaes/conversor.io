/** Vídeo acima do limite de duração permitido. Mapear para HTTP 400. */
export class VideoTooLongError extends Error {
  constructor(
    readonly actualSeconds: number,
    readonly maxSeconds: number,
  ) {
    super(
      `Vídeo muito longo: ${Math.round(actualSeconds)}s (máximo ${maxSeconds}s / ${Math.round(
        maxSeconds / 60,
      )} min).`,
    );
    this.name = "VideoTooLongError";
  }
}
