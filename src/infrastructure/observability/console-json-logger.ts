import "server-only";
import type { LogEvent, LoggerPort } from "@/domain/observability/ports/logger.port";
import { redactValue, serializeError } from "@/infrastructure/observability/redact";

type Level = "info" | "warn" | "error";

function formatProduction(level: Level, e: LogEvent): string {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
  };
  if (e.service !== undefined) payload.service = e.service;
  payload.event = e.event;
  if (e.requestId !== undefined) payload.requestId = e.requestId;
  if (e.userId !== undefined) payload.userId = e.userId;
  if (e.clientIp !== undefined) payload.clientIp = e.clientIp;
  if (e.durationMs !== undefined) payload.durationMs = e.durationMs;
  if (e.status !== undefined) payload.status = e.status;
  if (e.attempt !== undefined) payload.attempt = e.attempt;
  if (e.context !== undefined) payload.context = redactValue(e.context);
  const serializedError = serializeError(e.error);
  if (serializedError !== undefined) payload.error = serializedError;
  return JSON.stringify(payload);
}

function formatDev(level: Level, e: LogEvent): string {
  const time = new Date().toISOString().split("T")[1]?.replace("Z", "") ?? "";
  const levelLabel = level.toUpperCase().padEnd(5, " ");
  const service = e.service ? `[${e.service}] ` : "";
  const head = `${time} ${levelLabel} ${service}${e.event}`;

  const fields: string[] = [];
  if (e.status !== undefined) fields.push(`status=${e.status}`);
  if (e.durationMs !== undefined) fields.push(`durationMs=${e.durationMs}`);
  if (e.attempt !== undefined) fields.push(`attempt=${e.attempt}`);
  if (e.requestId !== undefined) fields.push(`requestId=${e.requestId}`);
  if (e.userId !== undefined) fields.push(`userId=${e.userId}`);
  if (e.clientIp !== undefined) fields.push(`clientIp=${e.clientIp}`);

  const parts = [head];
  if (fields.length > 0) parts.push(fields.join(" "));
  if (e.context !== undefined) parts.push(JSON.stringify(redactValue(e.context)));
  const serializedError = serializeError(e.error);
  if (serializedError !== undefined) parts.push(JSON.stringify(serializedError));

  return parts.join(" ");
}

/**
 * `LoggerPort` que emite uma linha por evento em `process.stdout`. Em produção emite JSON
 * estruturado (ordem fixa de chaves, chaves `undefined` omitidas); fora de produção emite
 * uma linha legível, sem cores ANSI. `context` e `error` sempre passam por redação.
 */
export class ConsoleJsonLogger implements LoggerPort {
  constructor(private readonly bindings: Partial<LogEvent> = {}) {}

  info(e: LogEvent): void {
    this.emit("info", e);
  }

  warn(e: LogEvent): void {
    this.emit("warn", e);
  }

  error(e: LogEvent): void {
    this.emit("error", e);
  }

  /** Devolve um novo logger com os bindings mesclados — nunca muta a instância atual. */
  child(bindings: Partial<LogEvent>): LoggerPort {
    return new ConsoleJsonLogger({ ...this.bindings, ...bindings });
  }

  private emit(level: Level, event: LogEvent): void {
    const merged: LogEvent = { ...this.bindings, ...event };
    const line =
      process.env.NODE_ENV === "production"
        ? formatProduction(level, merged)
        : formatDev(level, merged);
    process.stdout.write(`${line}\n`);
  }
}
