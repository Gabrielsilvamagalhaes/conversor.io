import { createHash } from "node:crypto";

/**
 * Redação de dados sensíveis para logs. Módulo puro (sem `server-only`) para poder ser
 * testado isoladamente — quem decide *onde* logar é o `LoggerPort`, aqui só decidimos
 * *o que* pode sair na linha de log.
 */

const MAX_DEPTH = 4;
const MAX_KEYS_PER_OBJECT = 50;
const MAX_STRING_LENGTH = 500;

/** Substrings (case-insensitive) que, presentes numa chave, redigem o valor inteiro. */
const DENYLIST_SUBSTRINGS = [
  "token",
  "idtoken",
  "session",
  "cookie",
  "authorization",
  "auth",
  "password",
  "senha",
  "privatekey",
  "private_key",
  "secret",
  "apikey",
  "api_key",
  "credential",
  "email",
  "cpf",
  "cnpj",
  "phone",
  "telefone",
  "filename",
  "file_name",
  "displayname",
] as const;

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  // Um hash é irreversível por construção, então é seguro logar mesmo quando o nome da
  // chave carrega um termo da denylist (`fileNameHash` casa com `filename`). Sem esta
  // exceção o identificador que existe justamente para correlacionar logs sem expor o
  // dado original seria redigido, e a correlação se perderia.
  if (lower.endsWith("hash")) return false;
  return DENYLIST_SUBSTRINGS.some((needle) => lower.includes(needle));
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`;
}

function redactInternal(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncateString(value);
  if (typeof value !== "object") return value;

  if (depth > MAX_DEPTH) return "[truncated]";

  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactInternal(item, depth + 1, seen));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_KEYS_PER_OBJECT) return "[truncated]";

  const result: Record<string, unknown> = {};
  for (const [key, val] of entries) {
    result[key] = isSensitiveKey(key) ? "[redacted]" : redactInternal(val, depth + 1, seen);
  }
  return result;
}

/**
 * Redige recursivamente um valor arbitrário antes de ir para o log: chaves sensíveis
 * (denylist por substring), strings longas, ciclos e profundidade/tamanho excessivos.
 */
export function redactValue(value: unknown, depth = 0): unknown {
  return redactInternal(value, depth, new WeakSet());
}

/**
 * Serializa um erro para log sem nunca expor o objeto cru (evita vazar `config`/`request`/
 * headers de libs como axios/firebase). Erros desconhecidos viram `UnknownError`.
 */
export function serializeError(
  error: unknown,
): { name: string; message: string; stack?: string } | undefined {
  if (error === undefined) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: truncateString(error.message),
      stack: error.stack ? truncateString(error.stack) : undefined,
    };
  }
  return { name: "UnknownError", message: truncateString(String(error)) };
}

/** Zera o último octeto de um IPv4; mantém só os 3 primeiros grupos de um IPv6. */
export function truncateIp(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const ipv4Match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.every((octet) => octet >= 0 && octet <= 255)) {
      return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
    }
    return undefined;
  }

  if (trimmed.includes(":")) {
    // Só os grupos antes de `::` são posicionalmente confiáveis: filtrar os vazios de um
    // endereço comprimido promoveria grupos da cauda para o prefixo (`2001:db8::1` viraria
    // `2001:db8:1::`, um prefixo que não é o do endereço original).
    const groups = trimmed
      .split("::")[0]
      .split(":")
      .filter((group) => group.length > 0);
    const hexGroup = /^[0-9a-fA-F]{1,4}$/;
    if (groups.length === 0 || !groups.every((group) => hexGroup.test(group))) {
      return undefined;
    }
    return `${groups.slice(0, 3).join(":")}::`;
  }

  return undefined;
}

/** Hash determinístico e curto de um nome de arquivo, para logar sem expor o nome real. */
export function hashFileName(name: string): string {
  return createHash("sha256").update(name).digest("hex").slice(0, 12);
}
