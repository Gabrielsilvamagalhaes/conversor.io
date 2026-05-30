# Camadas e Dependências

Detalhamento das camadas do [[Projeto Com Hans]].

## Matriz de dependências

```
presentation  →  application  →  domain  ←  infrastructure
                     ↑                              |
                     └──────── implements ──────────┘
```

| De → Para | domain | application | infrastructure | presentation |
| --- | --- | --- | --- | --- |
| **domain** | ✅ | ❌ | ❌ | ❌ |
| **application** | ✅ | ✅ | ❌ | ❌ |
| **infrastructure** | ✅ (ports) | ❌ | ✅ | ❌ |
| **presentation** | ❌* | ✅ | ❌** | ✅ |

\* Presentation não importa domain diretamente — passa por application/DTOs.  
\*\* Composition root (ex.: `src/di/container.ts`) pode instanciar infra e injetar em use cases.

## Composition Root

No Next.js, a composição fica em um módulo dedicado:

```
src/
  di/
    container.ts      # factory dos use cases + adapters
    env.ts            # validação de env (zod)
```

Route handlers e Server Actions **só** chamam use cases do container.

## Inversão de dependência — exemplo

**Port (domain/application):**

```typescript
export interface FileConverterPort {
  supports(pair: ConversionPair): boolean;
  convert(input: TempFile, pair: ConversionPair): Promise<ConvertedFile>;
}
```

**Adapter (infrastructure):**

```typescript
export class FfmpegVideoToAudioAdapter implements FileConverterPort {
  supports(pair: ConversionPair) {
    return pair.sourceCategory === 'video' && pair.target === 'mp3';
  }
  // ...
}
```

**Registry (application):**

```typescript
export class ConverterRegistry {
  constructor(private readonly converters: FileConverterPort[]) {}
  resolve(pair: ConversionPair): FileConverterPort { /* ... */ }
}
```

## Erros

| Camada | Tipo de erro | HTTP (presentation) |
| --- | --- | --- |
| Domain | `UnsupportedPairError`, `FileTooLargeError` | 400 |
| Application | `ConversionFailedError` | 422 |
| Infrastructure | `StorageUnavailableError` | 503 |
| Auth | `UnauthorizedError` | 401 |

Mapeamento HTTP fica **somente** na presentation.

## Cross-cutting

| Concern | Onde |
| --- | --- |
| Logging | Infrastructure + middleware |
| Auth guard | Presentation middleware + `GetSessionUseCase` |
| Rate limit | Presentation / edge middleware |
| Feature flags | Application (par habilitado no catálogo) |
