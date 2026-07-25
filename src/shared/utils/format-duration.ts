const SECONDS_FORMATTER = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/**
 * Formata uma duração em milissegundos para pt-BR: `812 ms`, `1,4 s`, `2 min 5 s`.
 * Abaixo de 1 s mostra milissegundos inteiros; abaixo de 1 min, segundos com 1 casa
 * decimal (vírgula); a partir de 1 min, minutos e segundos inteiros.
 */
export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return "—";
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;

  const totalSeconds = durationMs / 1000;
  if (totalSeconds < 60) return `${SECONDS_FORMATTER.format(totalSeconds)} s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes} min ${seconds} s`;
}
