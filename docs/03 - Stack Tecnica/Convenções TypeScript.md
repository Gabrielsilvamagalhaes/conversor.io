# Convenções TypeScript

Padrões de código TypeScript do [[Projeto Com Hans]].

## tsconfig (strict)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve"
  }
}
```

## Naming

| Item | Convenção | Exemplo |
| --- | --- | --- |
| Entities / VOs | PascalCase | `ConversionJob` |
| Use cases | PascalCase + UseCase | `ConvertFileUseCase` |
| Ports | PascalCase + Port | `FileConverterPort` |
| Adapters | PascalCase + Adapter | `XlsxToCsvAdapter` |
| DTOs | PascalCase + Dto | `ConversionJobDto` |
| Files | kebab-case | `convert-file.use-case.ts` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE_MB` |

## Branded types

```typescript
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };
export type JobId = Brand<string, 'JobId'>;
```

## Result pattern (opcional)

Para use cases com múltiplos erros de domínio:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

## Imports

Ordem (eslint-plugin-import):

1. Node builtins
2. External packages
3. `@/domain`, `@/application`, `@/infrastructure`, `@/app`
4. Relative

## Proibições

- `any` (exceto escape hatch documentado)
- `@ts-ignore` sem comentário explicativo
- Lógica de negócio em `page.tsx` / `route.ts` além de delegação

## Lint / format

- **ESLint 9** flat config
- **Prettier** para formatação
- Husky pre-commit: lint-staged

Integrado ao [[GitHub Actions]].
