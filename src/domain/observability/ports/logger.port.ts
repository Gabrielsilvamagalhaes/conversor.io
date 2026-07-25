/** Nível de severidade do evento de log. */
export type LogLevel = "info" | "warn" | "error";

/** Serviço lógico que originou o evento (não é o processo físico, é o bounded context). */
export type LogService =
  | "api-gateway"
  | "conversion-service"
  | "identity-service"
  | "history-service";

/**
 * Evento de log estruturado. `event` segue snake_case (ex.: `conversion_started`).
 * Campos sensíveis (nomes de arquivo, IP completo, cookies) nunca devem ser colocados
 * direto aqui sem passar antes por redação — ver `@/infrastructure/observability/redact`.
 */
export interface LogEvent {
  readonly event: string;
  readonly service?: LogService;
  readonly requestId?: string;
  readonly userId?: string;
  readonly clientIp?: string;
  readonly durationMs?: number;
  readonly status?: number;
  readonly attempt?: number;
  readonly context?: Record<string, unknown>;
  readonly error?: unknown;
}

/** Port de logging estruturado. Implementações vivem em `infrastructure/observability`. */
export interface LoggerPort {
  info(e: LogEvent): void;
  warn(e: LogEvent): void;
  error(e: LogEvent): void;
  /** Deriva um logger com campos fixos herdados (service, requestId, userId, clientIp). */
  child(bindings: Partial<LogEvent>): LoggerPort;
}
