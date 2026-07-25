import type { LogEvent, LoggerPort } from "@/domain/observability/ports/logger.port";

/** `LoggerPort` que não faz nada — útil para testes e para call-sites sem logger injetado. */
export class NoopLogger implements LoggerPort {
  info(_e: LogEvent): void {}

  warn(_e: LogEvent): void {}

  error(_e: LogEvent): void {}

  child(_bindings: Partial<LogEvent>): LoggerPort {
    return this;
  }
}
