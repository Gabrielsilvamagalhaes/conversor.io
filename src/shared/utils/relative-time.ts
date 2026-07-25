const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Rótulo absoluto pt-BR (`25 jul 2026, 14:32`) — estável entre servidor e cliente. */
export function formatAbsoluteDateTime(iso: string): string {
  return ABSOLUTE_FORMATTER.format(new Date(iso));
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Rótulo relativo pt-BR (`há 2 h`, `há 5 min`). `now` é injetável para determinismo em
 * teste; em produção o componente sempre chama sem o segundo argumento (relógio real).
 * Datas futuras (relógio do servidor levemente à frente) caem em "agora mesmo" em vez de
 * um relativo negativo sem sentido.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (diffMs < MINUTE_MS) return "agora mesmo";
  if (diffMs < HOUR_MS) return `há ${Math.floor(diffMs / MINUTE_MS)} min`;
  if (diffMs < DAY_MS) return `há ${Math.floor(diffMs / HOUR_MS)} h`;
  if (diffMs < MONTH_MS) return `há ${Math.floor(diffMs / DAY_MS)} d`;
  if (diffMs < YEAR_MS) return `há ${Math.floor(diffMs / MONTH_MS)} meses`;
  return `há ${Math.floor(diffMs / YEAR_MS)} anos`;
}
