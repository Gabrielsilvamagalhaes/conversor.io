# Entidades e Value Objects

Modelo de domínio do [[Projeto Com Hans]].

## Value Objects

### FileFormat

Representa extensão/MIME normalizado.

```typescript
class FileFormat {
  private constructor(public readonly extension: string) {}
  static fromFilename(name: string): FileFormat
  static fromMime(mime: string): FileFormat
  equals(other: FileFormat): boolean
}
```

**Formatos MVP:** `xlsx`, `csv`, `pdf`, `docx`, `json`, `mp4`, `webm`, `mov`, `mp3`, `wav`, `txt`.

### ConversionPair

```typescript
class ConversionPair {
  constructor(
    public readonly source: FileFormat,
    public readonly target: FileFormat,
  ) {
    Object.freeze(this);
  }
  toString(): string // "xlsx->csv"
}
```

### JobId, UserId, TempFileRef

IDs tipados (branded types) para evitar troca acidental.

```typescript
type JobId = string & { readonly brand: 'JobId' };
type TempFileRef = { path: string; sizeBytes: number; expiresAt: Date };
```

### JobStatus

Enum fechado: `pending` | `processing` | `completed` | `failed` | `expired`.

## Entidades

### ConversionJob (Aggregate Root)

Métodos de domínio:

- `startProcessing()` — valida transição de `pending`
- `complete(output: TempFileRef)` — seta `completed`
- `fail(reason: string)` — seta `failed`
- `isDownloadable()` — `status === completed && !isExpired()`

### ConversionCatalog (Entity ou Domain Service)

- `isSupported(pair: ConversionPair): boolean`
- `listEnabled(): ConversionPair[]`
- `getLimits(pair: ConversionPair): FileLimits`

## Erros de domínio

| Erro | Quando |
| --- | --- |
| `UnsupportedConversionPairError` | Par não no catálogo |
| `FileTooLargeError` | Acima do limite |
| `InvalidFileFormatError` | Extensão/MIME inválido |
| `InvalidJobTransitionError` | Status inválido |

## Factory

`ConversionJob.create({ pair, inputFile, userId? })` — garante invariantes na criação.

## Onde NÃO colocar lógica

| Lugar errado | Lugar certo |
| --- | --- |
| Component React | Use case |
| Route handler | Use case |
| Adapter ffmpeg | Adapter (infra) — job só recebe resultado |
| Firebase SDK | Auth adapter |

Ver [[Contexto Conversão de Arquivos]] e [[Contexto Autenticação]].
