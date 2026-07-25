const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/**
 * Formata bytes em unidade legível (B/KB/MB/GB/TB), com separador decimal pt-BR (vírgula).
 * Escolhe a maior unidade em que o valor fica >= 1, sem nunca passar de 1 casa decimal.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const formatted = exponent === 0 ? String(Math.round(value)) : NUMBER_FORMATTER.format(value);

  return `${formatted} ${UNITS[exponent]}`;
}
