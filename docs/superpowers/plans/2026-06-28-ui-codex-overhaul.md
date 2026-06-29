# UI "Codex de Da Vinci" + upload de .csv — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a home padrão por uma identidade visual profissional "Codex de Da Vinci" (tema claro/escuro, arte de domínio público), proteger `/app` por login e entregar a primeira fatia de upload de `.csv` (recebe + valida, sem conversão).

**Architecture:** Clean Architecture + DDD. O upload vive no bounded context **Conversão** (domain VOs/erros/port → application use case → infrastructure detector → presentation route/dropzone), injetado no composition root `src/di/container.ts`. UI em Next 16 App Router com shadcn/ui sobre tokens CSS Codex.

**Tech Stack:** Next 16 · React 19 · TypeScript strict · Tailwind 4 · Biome · shadcn/ui · Vitest (unit) · Playwright (E2E smoke). Fontes Fraunces + Inter via `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-06-28-ui-codex-overhaul-design.md`
**Branch:** `feat/ui/codex-overhaul`

**Convenções:** após cada tarefa rodar `pnpm check` (Biome) e `pnpm typecheck`. Commits Conventional. Nunca commitar `.env.local`.

---

## Mapa de arquivos

**Criar:**
- `vitest.config.ts`
- `src/shared/constants/upload.ts`
- `src/shared/utils/is-protected-path.ts` · `.test.ts`
- `src/domain/conversion/value-objects/file-name.ts` · `.test.ts`
- `src/domain/conversion/value-objects/accepted-format.ts` · `.test.ts`
- `src/domain/conversion/errors/empty-file.error.ts`
- `src/domain/conversion/errors/file-too-large.error.ts`
- `src/domain/conversion/errors/invalid-file-type.error.ts`
- `src/domain/conversion/ports/file-type-detector.port.ts`
- `src/application/conversion/validate-upload.use-case.ts` · `.test.ts`
- `src/infrastructure/conversion/magic-bytes-detector.ts` · `.test.ts`
- `src/app/api/upload/route.ts`
- `src/components/ui/*` (shadcn: button, input, sonner)
- `src/components/theme-toggle.tsx`
- `src/components/typewriter.tsx`
- `src/components/site-header.tsx`
- `src/components/site-footer.tsx`
- `src/components/file-dropzone.tsx`
- `src/app/app/page.tsx` (rota protegida `/app`)
- `public/art/vitruvian.jpg` · `public/art/selfportrait.jpg`
- `e2e/smoke.spec.ts` · `playwright.config.ts` (tarefa final)

**Modificar:**
- `package.json` (scripts de teste + deps)
- `src/app/layout.tsx` (fontes + script de tema + metadata)
- `src/app/globals.css` (tokens Codex claro/escuro)
- `src/app/page.tsx` (landing)
- `src/app/(auth)/login/page.tsx` (redesign)
- `src/shared/constants/auth.ts` (`PROTECTED_PATHS`)
- `src/proxy.ts` (matcher + helper testável)
- `src/di/container.ts` (wire do `validateUpload`)
- `CLAUDE.md` (seção de design)

---

## Task 1: Configurar Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Test: `src/shared/__smoke__.test.ts` (temporário)

- [ ] **Step 1: Instalar Vitest**

Run: `pnpm add -D vitest`

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Adicionar scripts em `package.json`**

Em `"scripts"`, adicionar:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Teste de fumaça**

Create `src/shared/__smoke__.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest is wired", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5: Rodar e verificar PASS**

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Remover o smoke e commitar**

```bash
rm src/shared/__smoke__.test.ts
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "build(test): add vitest runner"
```

---

## Task 2: Constantes de upload (limites + formatos)

**Files:**
- Create: `src/shared/constants/upload.ts`

- [ ] **Step 1: Criar constantes**

```ts
/** Limite de tamanho para documentos/dados (MVP). */
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/shared/constants/upload.ts
git commit -m "feat(conversion): add upload size constants"
```

---

## Task 3: VO `AcceptedFormat` (allowlist de extensões)

**Files:**
- Create: `src/domain/conversion/value-objects/accepted-format.ts`
- Test: `src/domain/conversion/value-objects/accepted-format.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest";
import { ACCEPTED_EXTENSIONS, isAcceptedExtension } from "./accepted-format";

describe("accepted-format", () => {
  it("aceita csv", () => {
    expect(isAcceptedExtension("csv")).toBe(true);
  });

  it("rejeita exe e formatos fora da allowlist", () => {
    expect(isAcceptedExtension("exe")).toBe(false);
    expect(isAcceptedExtension("xlsx")).toBe(false);
  });

  it("expõe a allowlist como readonly", () => {
    expect(ACCEPTED_EXTENSIONS).toContain("csv");
  });
});
```

- [ ] **Step 2: Rodar (FAIL)**

Run: `pnpm test src/domain/conversion/value-objects/accepted-format.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

```ts
/** Extensões aceitas no MVP (apenas `.csv` nesta fase). */
export const ACCEPTED_EXTENSIONS = ["csv"] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export function isAcceptedExtension(extension: string): extension is AcceptedExtension {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
}
```

- [ ] **Step 4: Rodar (PASS)**

Run: `pnpm test src/domain/conversion/value-objects/accepted-format.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/conversion/value-objects/accepted-format.ts src/domain/conversion/value-objects/accepted-format.test.ts
git commit -m "feat(conversion): add accepted-format value object"
```

---

## Task 4: VO `FileName` (sanitização + extensão)

**Files:**
- Create: `src/domain/conversion/value-objects/file-name.ts`
- Test: `src/domain/conversion/value-objects/file-name.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from "vitest";
import { FileName } from "./file-name";

describe("FileName", () => {
  it("extrai extensão em minúsculas", () => {
    expect(FileName.create("Dados.CSV").extension).toBe("csv");
  });

  it("remove caminho (sem path traversal)", () => {
    const name = FileName.create("../../etc/passwd.csv");
    expect(name.value).toBe("passwd.csv");
    expect(name.value).not.toContain("/");
    expect(name.value).not.toContain("..");
  });

  it("sanitiza caracteres perigosos", () => {
    expect(FileName.create("a b*?<>|.csv").value).toBe("a_b_____.csv");
  });

  it("rejeita nome vazio", () => {
    expect(() => FileName.create("   ")).toThrow();
  });

  it("extensão vazia quando não há ponto", () => {
    expect(FileName.create("semponto").extension).toBe("");
  });
});
```

- [ ] **Step 2: Rodar (FAIL)**

Run: `pnpm test src/domain/conversion/value-objects/file-name.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
/**
 * Nome de arquivo sanitizado. Remove diretórios (anti path traversal) e
 * caracteres perigosos; expõe a extensão normalizada em minúsculas.
 */
export class FileName {
  private constructor(
    readonly value: string,
    readonly extension: string,
  ) {}

  static create(raw: string): FileName {
    const base = raw.split(/[/\\]/).pop() ?? "";
    const sanitized = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
    if (sanitized.trim().length === 0 || sanitized === ".") {
      throw new Error("Nome de arquivo inválido.");
    }
    const dot = sanitized.lastIndexOf(".");
    const extension = dot > 0 ? sanitized.slice(dot + 1).toLowerCase() : "";
    return new FileName(sanitized, extension);
  }
}
```

- [ ] **Step 4: Rodar (PASS)**

Run: `pnpm test src/domain/conversion/value-objects/file-name.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/conversion/value-objects/file-name.ts src/domain/conversion/value-objects/file-name.test.ts
git commit -m "feat(conversion): add file-name value object with sanitization"
```

---

## Task 5: Erros de domínio do upload

**Files:**
- Create: `src/domain/conversion/errors/empty-file.error.ts`
- Create: `src/domain/conversion/errors/file-too-large.error.ts`
- Create: `src/domain/conversion/errors/invalid-file-type.error.ts`

- [ ] **Step 1: `empty-file.error.ts`**

```ts
/** Arquivo sem conteúdo (0 bytes). Mapear para HTTP 400 na presentation. */
export class EmptyFileError extends Error {
  constructor() {
    super("O arquivo está vazio.");
    this.name = "EmptyFileError";
  }
}
```

- [ ] **Step 2: `file-too-large.error.ts`**

```ts
/** Arquivo acima do limite permitido. Mapear para HTTP 400. */
export class FileTooLargeError extends Error {
  constructor(
    readonly actualBytes: number,
    readonly maxBytes: number,
  ) {
    super(`Arquivo muito grande: ${actualBytes} bytes (máximo ${maxBytes}).`);
    this.name = "FileTooLargeError";
  }
}
```

- [ ] **Step 3: `invalid-file-type.error.ts`**

```ts
/** Extensão fora da allowlist ou conteúdo binário/executável disfarçado. HTTP 400. */
export class InvalidFileTypeError extends Error {
  constructor(reason: string) {
    super(`Tipo de arquivo inválido: ${reason}`);
    this.name = "InvalidFileTypeError";
  }
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/domain/conversion/errors/
git commit -m "feat(conversion): add upload domain errors"
```

---

## Task 6: Port `FileTypeDetectorPort`

**Files:**
- Create: `src/domain/conversion/ports/file-type-detector.port.ts`

- [ ] **Step 1: Definir o port**

```ts
export interface FileTypeDetection {
  /** true quando o conteúdo parece binário (ex.: contém byte NUL). */
  readonly isBinary: boolean;
  /** Assinatura de formato binário conhecido detectada (ex.: "zip", "pdf"), se houver. */
  readonly signature: string | null;
}

/** Detecta o tipo real de um arquivo a partir dos primeiros bytes (não confia na extensão). */
export interface FileTypeDetectorPort {
  detect(bytes: Uint8Array): FileTypeDetection;
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/domain/conversion/ports/file-type-detector.port.ts
git commit -m "feat(conversion): add file-type detector port"
```

---

## Task 7: `ValidateUploadUseCase` (application, TDD com mock)

**Files:**
- Create: `src/application/conversion/validate-upload.use-case.ts`
- Test: `src/application/conversion/validate-upload.use-case.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from "vitest";
import type { FileTypeDetectorPort } from "@/domain/conversion/ports/file-type-detector.port";
import { ValidateUploadUseCase } from "./validate-upload.use-case";

const textDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: false, signature: null }),
};
const binaryDetector: FileTypeDetectorPort = {
  detect: () => ({ isBinary: true, signature: "zip" }),
};

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("ValidateUploadUseCase", () => {
  it("aceita um csv de texto válido", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    const result = useCase.execute({ fileName: "dados.csv", size: 12, bytes: bytes("a,b,c\n1,2,3") });
    expect(result.accepted).toBe(true);
    expect(result.extension).toBe("csv");
    expect(result.fileName).toBe("dados.csv");
  });

  it("rejeita arquivo vazio", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() => useCase.execute({ fileName: "x.csv", size: 0, bytes: new Uint8Array() })).toThrow(
      "vazio",
    );
  });

  it("rejeita acima do limite", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    const big = 11 * 1024 * 1024;
    expect(() => useCase.execute({ fileName: "x.csv", size: big, bytes: bytes("a") })).toThrow(
      "muito grande",
    );
  });

  it("rejeita extensão fora da allowlist", () => {
    const useCase = new ValidateUploadUseCase(textDetector);
    expect(() => useCase.execute({ fileName: "x.exe", size: 4, bytes: bytes("abcd") })).toThrow(
      "inválido",
    );
  });

  it("rejeita binário disfarçado de csv", () => {
    const useCase = new ValidateUploadUseCase(binaryDetector);
    expect(() => useCase.execute({ fileName: "x.csv", size: 4, bytes: bytes("PK..") })).toThrow(
      "inválido",
    );
  });
});
```

- [ ] **Step 2: Rodar (FAIL)**

Run: `pnpm test src/application/conversion/validate-upload.use-case.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import type { FileTypeDetectorPort } from "@/domain/conversion/ports/file-type-detector.port";
import { isAcceptedExtension } from "@/domain/conversion/value-objects/accepted-format";
import { FileName } from "@/domain/conversion/value-objects/file-name";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/shared/constants/upload";

export interface ValidateUploadInput {
  readonly fileName: string;
  readonly size: number;
  readonly bytes: Uint8Array;
}

export interface ValidatedUpload {
  readonly accepted: true;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly extension: string;
  readonly message: string;
}

/**
 * Recebe e valida um upload (sem conversão nesta fase): tamanho, allowlist de
 * extensão e rejeição de binários/executáveis disfarçados via FileTypeDetectorPort.
 */
export class ValidateUploadUseCase {
  constructor(private readonly detector: FileTypeDetectorPort) {}

  execute(input: ValidateUploadInput): ValidatedUpload {
    if (input.size <= 0) throw new EmptyFileError();
    if (input.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new FileTooLargeError(input.size, MAX_DOCUMENT_SIZE_BYTES);
    }

    const name = FileName.create(input.fileName);
    if (!isAcceptedExtension(name.extension)) {
      throw new InvalidFileTypeError(`extensão ".${name.extension}" não suportada`);
    }

    const detection = this.detector.detect(input.bytes);
    if (detection.isBinary || detection.signature !== null) {
      throw new InvalidFileTypeError("conteúdo binário não corresponde a um .csv de texto");
    }

    return {
      accepted: true,
      fileName: name.value,
      sizeBytes: input.size,
      extension: name.extension,
      message: "Arquivo recebido e validado. A conversão chega na próxima fase.",
    };
  }
}
```

- [ ] **Step 4: Rodar (PASS)**

Run: `pnpm test src/application/conversion/validate-upload.use-case.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/application/conversion/
git commit -m "feat(conversion): add validate-upload use case"
```

---

## Task 8: `MagicBytesDetector` (infrastructure, TDD)

**Files:**
- Create: `src/infrastructure/conversion/magic-bytes-detector.ts`
- Test: `src/infrastructure/conversion/magic-bytes-detector.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from "vitest";
import { MagicBytesDetector } from "./magic-bytes-detector";

const detector = new MagicBytesDetector();

describe("MagicBytesDetector", () => {
  it("reconhece texto csv como não-binário sem assinatura", () => {
    const out = detector.detect(new TextEncoder().encode("a,b\n1,2"));
    expect(out.isBinary).toBe(false);
    expect(out.signature).toBeNull();
  });

  it("detecta assinatura ZIP (PK)", () => {
    const out = detector.detect(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]));
    expect(out.signature).toBe("zip");
  });

  it("detecta assinatura PDF", () => {
    const out = detector.detect(new TextEncoder().encode("%PDF-1.7"));
    expect(out.signature).toBe("pdf");
  });

  it("detecta executável (MZ)", () => {
    const out = detector.detect(new Uint8Array([0x4d, 0x5a, 0x90]));
    expect(out.signature).toBe("exe");
  });

  it("marca binário quando há byte NUL", () => {
    const out = detector.detect(new Uint8Array([0x61, 0x00, 0x62]));
    expect(out.isBinary).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar (FAIL)**

Run: `pnpm test src/infrastructure/conversion/magic-bytes-detector.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
import type {
  FileTypeDetection,
  FileTypeDetectorPort,
} from "@/domain/conversion/ports/file-type-detector.port";

interface Signature {
  readonly name: string;
  readonly magic: readonly number[];
}

/** Assinaturas binárias comuns que NUNCA devem se passar por um .csv. */
const SIGNATURES: readonly Signature[] = [
  { name: "zip", magic: [0x50, 0x4b] }, // PK (zip/xlsx/docx)
  { name: "pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { name: "exe", magic: [0x4d, 0x5a] }, // MZ
  { name: "elf", magic: [0x7f, 0x45, 0x4c, 0x46] }, // .ELF
  { name: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { name: "gif", magic: [0x47, 0x49, 0x46] }, // GIF
  { name: "jpg", magic: [0xff, 0xd8, 0xff] },
];

const SCAN_LIMIT = 512;

export class MagicBytesDetector implements FileTypeDetectorPort {
  detect(bytes: Uint8Array): FileTypeDetection {
    const signature = this.matchSignature(bytes);
    const isBinary = signature !== null || this.hasNullByte(bytes);
    return { isBinary, signature };
  }

  private matchSignature(bytes: Uint8Array): string | null {
    for (const sig of SIGNATURES) {
      if (sig.magic.every((byte, i) => bytes[i] === byte)) return sig.name;
    }
    return null;
  }

  private hasNullByte(bytes: Uint8Array): boolean {
    const limit = Math.min(bytes.length, SCAN_LIMIT);
    for (let i = 0; i < limit; i++) {
      if (bytes[i] === 0x00) return true;
    }
    return false;
  }
}
```

- [ ] **Step 4: Rodar (PASS)**

Run: `pnpm test src/infrastructure/conversion/magic-bytes-detector.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/conversion/
git commit -m "feat(conversion): add magic-bytes detector adapter"
```

---

## Task 9: Wire no container + route handler `POST /api/upload`

**Files:**
- Modify: `src/di/container.ts`
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Estender o container**

Substituir o conteúdo de `src/di/container.ts` por:

```ts
import "server-only";
import { ValidateUploadUseCase } from "@/application/conversion/validate-upload.use-case";
import { CreateSessionUseCase } from "@/application/identity/create-session.use-case";
import { GetSessionUseCase } from "@/application/identity/get-session.use-case";
import { RevokeSessionUseCase } from "@/application/identity/revoke-session.use-case";
import { FirebaseAuthAdapter } from "@/infrastructure/auth/firebase-auth.adapter";
import { MagicBytesDetector } from "@/infrastructure/conversion/magic-bytes-detector";

/**
 * Composition root: instancia os adapters de infraestrutura e injeta nos use cases.
 * Route handlers e Server Components devem consumir os use cases somente daqui.
 */
export interface Container {
  readonly createSession: CreateSessionUseCase;
  readonly getSession: GetSessionUseCase;
  readonly revokeSession: RevokeSessionUseCase;
  readonly validateUpload: ValidateUploadUseCase;
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  const authSession = new FirebaseAuthAdapter();
  const fileTypeDetector = new MagicBytesDetector();

  cached = {
    createSession: new CreateSessionUseCase(authSession),
    getSession: new GetSessionUseCase(authSession),
    revokeSession: new RevokeSessionUseCase(authSession),
    validateUpload: new ValidateUploadUseCase(fileTypeDetector),
  };
  return cached;
}
```

- [ ] **Step 2: Criar o route handler**

`src/app/api/upload/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { EmptyFileError } from "@/domain/conversion/errors/empty-file.error";
import { FileTooLargeError } from "@/domain/conversion/errors/file-too-large.error";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";

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
    if (
      error instanceof EmptyFileError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidFileTypeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Falha ao validar o upload." }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm typecheck && pnpm test && pnpm check`
Expected: tudo verde.

- [ ] **Step 4: Commit**

```bash
git add src/di/container.ts src/app/api/upload/route.ts
git commit -m "feat(api): add upload validation endpoint"
```

---

## Task 10: Helper `isProtectedPath` + atualizar proxy/constantes

**Files:**
- Create: `src/shared/utils/is-protected-path.ts`
- Test: `src/shared/utils/is-protected-path.test.ts`
- Modify: `src/shared/constants/auth.ts`
- Modify: `src/proxy.ts`

- [ ] **Step 1: Teste do helper (falha)**

```ts
import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./is-protected-path";

describe("isProtectedPath", () => {
  it("protege a rota exata", () => {
    expect(isProtectedPath("/app", ["/app"])).toBe(true);
  });
  it("protege subrotas", () => {
    expect(isProtectedPath("/app/upload", ["/app"])).toBe(true);
  });
  it("não protege rotas públicas", () => {
    expect(isProtectedPath("/", ["/app"])).toBe(false);
    expect(isProtectedPath("/login", ["/app"])).toBe(false);
  });
  it("não confunde prefixo parcial", () => {
    expect(isProtectedPath("/application", ["/app"])).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar (FAIL)**

Run: `pnpm test src/shared/utils/is-protected-path.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar o helper**

```ts
/** True se `pathname` é a rota protegida exata ou uma subrota dela. */
export function isProtectedPath(pathname: string, protectedPaths: readonly string[]): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
```

- [ ] **Step 4: Rodar (PASS)**

Run: `pnpm test src/shared/utils/is-protected-path.test.ts`
Expected: PASS.

- [ ] **Step 5: Atualizar `PROTECTED_PATHS`**

Em `src/shared/constants/auth.ts`, substituir a linha do `PROTECTED_PATHS` por:

```ts
/** Rotas que exigem sessão (verificação completa server-side). */
export const PROTECTED_PATHS = ["/app"] as const;
```

- [ ] **Step 6: Refatorar `src/proxy.ts` para usar o helper**

```ts
import { type NextRequest, NextResponse } from "next/server";
import { PROTECTED_PATHS, SESSION_COOKIE_NAME } from "@/shared/constants/auth";
import { isProtectedPath } from "@/shared/utils/is-protected-path";

/**
 * Proxy do Next.js 16 (sucessor do `middleware.ts`). Roda no Edge — gate barato
 * por presença do cookie; a verificação completa é server-side (Node runtime).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname, PROTECTED_PATHS)) return NextResponse.next();

  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*"],
};
```

- [ ] **Step 7: Verificar + commit**

```bash
pnpm typecheck && pnpm test && pnpm check
git add src/shared/utils/ src/shared/constants/auth.ts src/proxy.ts
git commit -m "feat(auth): protect /app route via proxy"
```

---

## Task 11: Tokens de cor Codex + fontes (globals.css + layout)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Reescrever `src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  --bg: #f4f0e7;
  --bg-elev: #ece5d6;
  --fg: #211d15;
  --muted: #6c6354;
  --sanguine: #b1502f;
  --gold: #9a7a2c;
  --line: rgba(33, 29, 21, 0.14);
}

.dark {
  --bg: #14120d;
  --bg-elev: #1b1813;
  --fg: #efe7d6;
  --muted: #9b9180;
  --sanguine: #c8694a;
  --gold: #cda851;
  --line: rgba(239, 231, 214, 0.14);
}

@theme inline {
  --color-bg: var(--bg);
  --color-bg-elev: var(--bg-elev);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-sanguine: var(--sanguine);
  --color-gold: var(--gold);
  --color-line: var(--line);
  --font-display: var(--font-fraunces);
  --font-sans: var(--font-inter);
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-inter), system-ui, sans-serif;
}

::selection {
  background: var(--sanguine);
  color: var(--bg);
}
```

- [ ] **Step 2: Reescrever `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "conversor.io — do códice ao código",
  description:
    "A oficina renascentista dos seus arquivos. Converta planilhas, documentos, dados e mídia com a precisão de um mestre.",
};

/** Aplica o tema antes da pintura (sistema + escolha salva) para evitar FOUC. */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: anti-FOUC theme bootstrap */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar build + commit**

```bash
pnpm typecheck && pnpm check && pnpm build
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(ui): add codex theme tokens and fonts"
```

---

## Task 12: shadcn/ui (button, input, sonner)

**Files:**
- Create: `src/components/ui/*` · `components.json` (gerado)
- Modify: `src/app/globals.css` (vars do shadcn, append)

- [ ] **Step 1: Inicializar shadcn (canary, Tailwind 4)**

Run: `pnpm dlx shadcn@canary init -d`
Quando perguntar a base color, escolher **Neutral**. Isso cria `components.json` e utilitário `cn`.

- [ ] **Step 2: Adicionar componentes**

Run: `pnpm dlx shadcn@canary add button input sonner`

- [ ] **Step 3: Mapear os tokens shadcn aos tokens Codex**

No bloco que o shadcn adicionar ao `globals.css`, garantir que `--primary`/`--background`/`--foreground`/`--ring` referenciem os tokens Codex. Append ao final do `globals.css`:

```css
:root {
  --background: var(--bg);
  --foreground: var(--fg);
  --primary: var(--fg);
  --primary-foreground: var(--bg);
  --ring: var(--sanguine);
  --border: var(--line);
}
.dark {
  --background: var(--bg);
  --foreground: var(--fg);
  --primary: var(--fg);
  --primary-foreground: var(--bg);
  --ring: var(--sanguine);
  --border: var(--line);
}
```

- [ ] **Step 4: Formatar componentes gerados + verificar**

Run: `pnpm check && pnpm typecheck && pnpm build`
Expected: verde (o `pnpm check` reformata `src/components/ui` no estilo Biome).

- [ ] **Step 5: Commit**

```bash
git add components.json src/components/ui src/lib src/app/globals.css package.json pnpm-lock.yaml
git commit -m "build(ui): integrate shadcn/ui with codex tokens"
```

---

## Task 13: Toggle de tema

**Files:**
- Create: `src/components/theme-toggle.tsx`

- [ ] **Step 1: Implementar (client component)**

```tsx
"use client";

import { useEffect, useState } from "react";

/** Alterna claro/escuro e persiste em localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}
```

- [ ] **Step 2: Verificar + commit**

```bash
pnpm typecheck && pnpm check
git add src/components/theme-toggle.tsx
git commit -m "feat(ui): add theme toggle"
```

---

## Task 14: Componente `Typewriter`

**Files:**
- Create: `src/components/typewriter.tsx`

- [ ] **Step 1: Implementar (respeita reduced motion)**

```tsx
"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  readonly words: readonly string[];
  readonly className?: string;
}

/** Digita/apaga palavras em ciclo. Com prefers-reduced-motion, mostra só a primeira. */
export function Typewriter({ words, className }: TypewriterProps) {
  const [text, setText] = useState(words[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let word = 0;
    let char = words[0]?.length ?? 0;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = words[word] ?? "";
      setText(current.slice(0, char));
      if (!deleting && char < current.length) {
        char++;
        timer = setTimeout(tick, 72);
      } else if (!deleting) {
        deleting = true;
        timer = setTimeout(tick, 1900);
      } else if (deleting && char > 0) {
        char--;
        timer = setTimeout(tick, 34);
      } else {
        deleting = false;
        word = (word + 1) % words.length;
        timer = setTimeout(tick, 300);
      }
    };

    timer = setTimeout(tick, 1900);
    return () => clearTimeout(timer);
  }, [words]);

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block w-0.5 animate-pulse bg-sanguine align-baseline">
        &nbsp;
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Verificar + commit**

```bash
pnpm typecheck && pnpm check
git add src/components/typewriter.tsx
git commit -m "feat(ui): add typewriter component"
```

---

## Task 15: Baixar a arte para `public/art`

**Files:**
- Create: `public/art/vitruvian.jpg`, `public/art/selfportrait.jpg`

- [ ] **Step 1: Criar a pasta**

Run (PowerShell): `New-Item -ItemType Directory -Force public/art | Out-Null`

- [ ] **Step 2: Baixar os originais (domínio público, Wikimedia) com User-Agent**

```powershell
$ua = "conversor.io/1.0 (https://conversor.io; gabiles278@gmail.com)"
Invoke-WebRequest -Headers @{ "User-Agent" = $ua } -OutFile public/art/vitruvian.jpg `
  -Uri "https://upload.wikimedia.org/wikipedia/commons/2/22/Da_Vinci_Vitruve_Luc_Viatour.jpg"
Invoke-WebRequest -Headers @{ "User-Agent" = $ua } -OutFile public/art/selfportrait.jpg `
  -Uri "https://upload.wikimedia.org/wikipedia/commons/3/38/Leonardo_da_Vinci_-_presumed_self-portrait_-_WGA12798.jpg"
```

> Nota: usar os tamanhos originais (o Wikimedia rejeita thumbnails de tamanho não-padrão com HTTP 400).

- [ ] **Step 3: Confirmar e commitar**

Run: `Get-ChildItem public/art`
Expected: dois `.jpg` com tamanho > 0.

```bash
git add public/art/vitruvian.jpg public/art/selfportrait.jpg
git commit -m "feat(ui): add public-domain da vinci artwork"
```

---

## Task 16: Rodapé do site

**Files:**
- Create: `src/components/site-footer.tsx`

- [ ] **Step 1: Implementar**

```tsx
import Link from "next/link";

const FORMATS = ["xlsx ↔ csv", "docx → pdf", "pdf → txt", "json ↔ csv", "vídeo → áudio"];

/** Rodapé: colunas + contato + barra legal. Arte é domínio público (Wikimedia). */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-elev">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-lg">
            conversor<span className="text-sanguine">.io</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            A oficina renascentista dos seus arquivos. Do códice ao código.
          </p>
        </div>

        <nav aria-label="Formatos">
          <p className="text-xs uppercase tracking-widest text-gold">Formatos</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {FORMATS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Produto">
          <p className="text-xs uppercase tracking-widest text-gold">Produto</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/app" className="text-muted hover:text-fg">
                Converter
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted hover:text-fg">
                Entrar
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Contato</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a href="mailto:gabiles278@gmail.com" className="text-muted hover:text-fg">
                gabiles278@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Gabrielsilvamagalhaes"
                className="text-muted hover:text-fg"
              >
                github.com/Gabrielsilvamagalhaes
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-6 py-5 text-center text-xs text-muted">
        © 2026 conversor.io — todos os direitos reservados · arte de Leonardo da Vinci (domínio
        público, via Wikimedia Commons)
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verificar + commit**

```bash
pnpm typecheck && pnpm check
git add src/components/site-footer.tsx
git commit -m "feat(ui): add site footer"
```

---

## Task 17: Cabeçalho do site

**Files:**
- Create: `src/components/site-header.tsx`

- [ ] **Step 1: Implementar**

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Top nav da landing: wordmark, links e toggle de tema. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="font-display text-lg font-semibold">
        conversor<span className="text-sanguine">.io</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-muted">
        <Link href="/app" className="hidden hover:text-fg sm:inline">
          Formatos
        </Link>
        <ThemeToggle />
        <Link
          href="/login"
          className="rounded-full border border-line px-4 py-1.5 text-fg hover:bg-bg-elev"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Verificar + commit**

```bash
pnpm typecheck && pnpm check
git add src/components/site-header.tsx
git commit -m "feat(ui): add site header"
```

---

## Task 18: Landing page `/`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Reescrever `src/app/page.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Typewriter } from "@/components/typewriter";

const PHRASES = ["um mestre.", "Da Vinci.", "do Renascimento.", "um relojoeiro."];
const FORMATS = ["xlsx ↔ csv", "docx → pdf", "pdf → txt", "json ↔ csv", "vídeo → áudio"];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-gold before:inline-block before:h-px before:w-7 before:bg-gold">
              Renascença digital
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.04] tracking-tight md:text-5xl">
              Converta arquivos com a precisão de{" "}
              <Typewriter words={PHRASES} className="italic text-sanguine" />
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Upload, transmutação no servidor, download. Planilhas, documentos, dados e mídia — em
              segundos, sem fricção.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/app"
                className="rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Começar a converter
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line px-6 py-3 text-sm font-medium hover:bg-bg-elev"
              >
                Entrar
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <span key={f} className="rounded border border-line px-2.5 py-1 text-xs text-muted">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-bg-elev md:aspect-auto md:h-[34rem]">
            <Image
              src="/art/vitruvian.jpg"
              alt="Homem Vitruviano de Leonardo da Vinci"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-[50%_16%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            <p className="absolute bottom-3 right-3 text-right text-[0.65rem] leading-tight text-muted">
              <span className="font-display text-fg">Homo Vitruvianus</span>
              <br />
              Leonardo da Vinci · c. 1490
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verificar build + commit**

```bash
pnpm typecheck && pnpm check && pnpm build
git add src/app/page.tsx
git commit -m "feat(ui): add codex landing page"
```

---

## Task 19: Redesenhar `/login`

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Reescrever a página mantendo a lógica de auth existente**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from "@/infrastructure/auth/browser-auth";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/app";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setError(null);
    setPending(true);
    try {
      await action();
      router.replace(redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao autenticar.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void run(() =>
      mode === "signin" ? signInWithEmail(email, password) : registerWithEmail(email, password),
    );
  }

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="font-display text-lg font-semibold">
            conversor<span className="text-sanguine">.io</span>
          </Link>
          <h1 className="mt-8 font-display text-3xl">
            {mode === "signin" ? "Entre no studiolo." : "Crie sua conta."}
          </h1>
          <p className="mt-2 text-sm text-muted">Sua oficina de transmutação de arquivos.</p>

          <button
            type="button"
            disabled={pending}
            onClick={() => void run(signInWithGoogle)}
            className="mt-8 w-full rounded-md border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-bg-elev disabled:opacity-50"
          >
            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="mestre@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sanguine"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sanguine"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Aguarde…" : mode === "signin" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          {error ? <p className="mt-4 text-center text-sm text-sanguine">{error}</p> : null}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-sm text-muted underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
          </button>
        </div>
      </div>

      <div className="relative hidden bg-bg-elev md:block">
        <Image
          src="/art/selfportrait.jpg"
          alt="Autorretrato de Leonardo da Vinci"
          fill
          sizes="50vw"
          className="object-cover object-top"
        />
        <p className="absolute bottom-4 right-4 text-right text-[0.65rem] leading-tight text-muted">
          <span className="font-display text-fg">Autorritratto</span>
          <br />
          Leonardo da Vinci · c. 1512
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar build + commit**

```bash
pnpm typecheck && pnpm check && pnpm build
git add "src/app/(auth)/login/page.tsx"
git commit -m "feat(auth): redesign login page in codex style"
```

---

## Task 20: `FileDropzone` (client) + página `/app`

**Files:**
- Create: `src/components/file-dropzone.tsx`
- Create: `src/app/app/page.tsx`

- [ ] **Step 1: Implementar `FileDropzone`**

```tsx
"use client";

import { type DragEvent, useRef, useState } from "react";

type Status = "idle" | "validating" | "accepted" | "rejected";

interface UploadResult {
  fileName?: string;
  sizeBytes?: number;
  message?: string;
  error?: string;
}

/** Área de upload de .csv: arraste-e-solte ou clique. Só valida (sem conversão). */
export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);

  async function upload(file: File): Promise<void> {
    setStatus("validating");
    setResult(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data: UploadResult = await res.json();
    if (res.ok) {
      setStatus("accepted");
      setResult(data);
    } else {
      setStatus("rejected");
      setResult(data);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <div className="w-full max-w-xl">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target wraps a real input/button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? "border-sanguine bg-sanguine/5" : "border-line"
        }`}
      >
        <p className="font-display text-xl">Deposite seu códice</p>
        <p className="mt-2 text-sm text-muted">
          Arraste um arquivo <strong>.csv</strong> aqui, ou
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          Escolher arquivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <p className="mt-6 text-xs text-muted">
          Apenas .csv · máx. 10 MB · validamos a matéria antes de converter
        </p>
      </div>

      {status === "validating" ? <p className="mt-4 text-sm text-muted">Validando…</p> : null}
      {status === "accepted" && result ? (
        <div className="mt-4 rounded-lg border border-line bg-bg-elev p-4 text-sm">
          <p className="font-medium text-fg">✓ {result.fileName}</p>
          <p className="mt-1 text-muted">{result.message}</p>
        </div>
      ) : null}
      {status === "rejected" && result ? (
        <p className="mt-4 rounded-lg border border-sanguine/40 bg-sanguine/5 p-4 text-sm text-sanguine">
          {result.error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Implementar `src/app/app/page.tsx` (Server Component protegido)**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileDropzone } from "@/components/file-dropzone";
import { getServerSession } from "@/infrastructure/auth/server-session";

export default async function AppPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/app");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold">
          conversor<span className="text-sanguine">.io</span>
        </Link>
        <span className="text-sm text-muted">{user.email ?? "sessão ativa"}</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <span className="text-xs uppercase tracking-[0.22em] text-gold">Transmutação</span>
        <h1 className="mt-3 font-display text-3xl">Converter arquivo</h1>
        <p className="mt-2 mb-8 text-sm text-muted">
          Comece pelo .csv. A conversão real chega na próxima fase.
        </p>
        <FileDropzone />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verificar build + commit**

```bash
pnpm typecheck && pnpm check && pnpm build
git add src/components/file-dropzone.tsx src/app/app/page.tsx
git commit -m "feat(conversion): add upload page and dropzone"
```

---

## Task 21: Atualizar CLAUDE.md (seção de design)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Adicionar a seção após "## Produto"**

Inserir antes de "## Escopo MVP":

```markdown
## Design — Codex de Da Vinci

Identidade visual "Renascença digital": arte de **Leonardo da Vinci** (domínio público,
Wikimedia) como peça central, à maneira do Hermes/Nous. Mote de marca: **"Codex de Da Vinci"**
(e "do códice ao código").

- **Tipografia:** `Fraunces` (display) + `Inter` (UI/corpo), via `next/font/google`.
- **Tokens** (CSS vars em `globals.css`, claro + `.dark`): `--bg`, `--bg-elev`, `--fg`,
  `--muted`, `--sanguine` (acento), `--gold` (acento raro), `--line`. Tema padrão segue o
  sistema (`prefers-color-scheme`) com toggle manual persistido em `localStorage`.
- **UI kit:** shadcn/ui (base neutral) com os tokens acima mapeados.
- **Arte:** `public/art/` (originais de domínio público); creditar autor/obra/fonte no rodapé.
- **Princípio:** restrição; a ousadia mora na arte. Evitar o clichê creme+serifa+terracota.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: register codex de da vinci design system"
```

---

## Task 22: E2E smoke (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Modify: `package.json` (script `e2e`)

- [ ] **Step 1: Instalar Playwright**

Run: `pnpm add -D @playwright/test` então `pnpm exec playwright install chromium`

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: Adicionar script em `package.json`**

```json
    "e2e": "playwright test"
```

- [ ] **Step 4: `e2e/smoke.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("landing pública carrega com hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Converta arquivos");
  await expect(page.getByAltText(/Homem Vitruviano/i)).toBeVisible();
});

test("/app redireciona para login quando deslogado", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("login mostra opção do Google", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
});
```

- [ ] **Step 5: Rodar**

Run: `pnpm e2e`
Expected: 3 passed. (Requer `.env.local` com as chaves Firebase para o build; o redirect de `/app` funciona sem login real porque o proxy só checa presença do cookie.)

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e/smoke.spec.ts package.json pnpm-lock.yaml
git commit -m "test(e2e): add smoke tests for landing, login and gate"
```

---

## Verificação final

- [ ] `pnpm test` — todos os unit/integration verdes
- [ ] `pnpm typecheck` — sem erros
- [ ] `pnpm check` — Biome limpo
- [ ] `pnpm build` — build de produção OK (`/`, `/login`, `/app`, `/api/upload`, Proxy)
- [ ] `pnpm e2e` — smoke verde
- [ ] Conferir manualmente: toggle de tema, typewriter, upload de csv válido (aceito) e de um .zip renomeado para .csv (rejeitado)

## Cobertura da spec (self-review)

- §2 Design system → Tasks 11, 12, 13, 14
- §3 Curadoria de arte → Task 15 (+ créditos no rodapé Task 16)
- §4 Rotas/proteção → Task 10
- §5.1 Landing → Tasks 17, 18
- §5.2 Login → Task 19
- §5.3 /app upload → Task 20
- §6 Rodapé → Task 16
- §7 Upload Clean Architecture → Tasks 2–9
- §8 shadcn → Task 12
- §9 CLAUDE.md → Task 21
- §10 Testes → Tasks 1 (runner), unit em 3–10, E2E em 22
