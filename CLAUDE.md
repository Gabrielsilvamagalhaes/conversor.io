# CLAUDE.md

Guia para agentes de IA trabalhando neste repositório. Documentação completa em `/docs`
(espelho do vault Obsidian **Projeto Com Hans**). Em caso de dúvida sobre domínio ou
arquitetura, consulte `/docs` antes de codar.

> **Idioma:** responda **sempre em português (pt-BR)** nas interações com o usuário.
> Código, nomes de identificadores e mensagens de commit seguem o padrão em inglês definido
> nas convenções abaixo.

## Produto

**conversor.io** — site conversor de arquivos full-stack. Aceita upload, converte no servidor
e entrega download. MVP (v0.1): 5 formatos de documento/dados + vídeo → áudio.

| Item | Decisão |
| --- | --- |
| Domínio / repo | conversor.io / `conversor-io` |
| Arquitetura | Clean Architecture + DDD |
| Stack | Next.js 16 (App Router) · React 19 · TypeScript 5 strict · Node.js 22 |
| Auth | Firebase Authentication (adapter de infra, não é domínio) |
| Lint/Format | **Biome** (substitui ESLint + Prettier) |
| Commits | Conventional Commits |
| Branches | Conventional Branches (trunk-based em `main`) |
| Deploy | Vercel · CI via GitHub Actions |

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

## Escopo MVP

| Categoria | Pares |
| --- | --- |
| Planilhas | `.xlsx` ↔ `.csv` |
| Documentos | `.docx` → `.pdf`, `.pdf` → `.txt` |
| Dados | `.json` ↔ `.csv` |
| Mídia | vídeo (`.mp4`/`.webm`/`.mov`) → `.mp3`/`.wav` |

Fora do MVP: transcrição com IA, conversões em lote, API pública, planos/monetização.

## Comandos

```bash
pnpm dev          # dev server (localhost:3000)
pnpm build        # build de produção
pnpm start        # serve build
pnpm lint         # biome lint ./src
pnpm format       # biome format --write ./src
pnpm check        # biome check --write ./src  (lint + format + organize imports)
pnpm typecheck    # tsc --noEmit
```

Gerenciador de pacotes: **pnpm**. Node fixado em **22** (`engines.node >=22`).
Para conversões locais completas é preciso `ffmpeg` e LibreOffice (`soffice`) no PATH.

## Arquitetura — Clean Architecture + DDD

Domínio no centro, infraestrutura na borda. **Código interno nunca importa código externo;
adapters implementam ports.**

```
presentation  →  application  →  domain  ←  infrastructure
                     ↑                              │
                     └──────── implements ──────────┘
```

| Camada | Conteúdo | Proibido |
| --- | --- | --- |
| **Domain** | Entidades, Value Objects, erros de domínio, ports (interfaces) | Next, Firebase, ffmpeg, fs |
| **Application** | Use cases, orquestração, DTOs, validação de entrada | Detalhes de libs externas |
| **Infrastructure** | Adapters (Firebase, storage, conversores) | Regras de negócio |
| **Presentation** | Pages, components, route handlers finos | Lógica de conversão |

- Presentation **não** importa `domain` direto — passa por application/DTOs.
- Composition root em `src/di/container.ts` instancia infra e injeta nos use cases.
- Route handlers e Server Actions **só** chamam use cases do container.
- Mapeamento de erros → HTTP fica **somente** na presentation.

### Bounded Contexts

- **Conversão** — agregado raiz `ConversionJob`; catálogo de pares, ciclo de vida
  (`pending` → `processing` → `completed` | `failed`), arquivos temp de entrada/saída.
- **Identidade** — agregado `AuthenticatedUser` (thin; Firebase é source of truth);
  resolve sessão e expõe `userId`.
- Contextos se comunicam por application services / domain events — sem acoplar agregados
  de contextos diferentes. Nunca importar `firebase-admin` dentro de `ConversionJob`.

### Conversores

Cada par de conversão = **um adapter** implementando `FileConverterPort`, registrado no
`ConverterRegistry`. Ex.: `XlsxToCsvAdapter`, `FfmpegVideoToAudioAdapter`. Adicionar um
formato = adicionar um adapter, sem reescrever o core.

## Estrutura de pastas (`src/`)

```
src/
├── app/              # Presentation (App Router): pages, layouts, api/route handlers, middleware
├── domain/           # conversion/ · identity/ · catalog/  (entities, value-objects, errors, ports)
├── application/      # use cases por contexto + services/ (converter-registry)
├── infrastructure/   # auth/ · storage/ · persistence/ · converters/ · ffmpeg/
├── di/               # container.ts (composition root) · env.ts (validação zod)
└── shared/           # types/ · utils/ · constants/
```

Path alias: `@/*` → `./src/*`. **Proibido** `@/infrastructure` importado de `@/domain`.

## Convenções TypeScript

`strict: true`. Evite `any` (escape hatch só documentado) e `@ts-ignore` sem comentário.
Sem lógica de negócio em `page.tsx`/`route.ts` além de delegação.

| Item | Convenção | Exemplo |
| --- | --- | --- |
| Entities / VOs | PascalCase | `ConversionJob` |
| Use cases | PascalCase + `UseCase` | `ConvertFileUseCase` |
| Ports | PascalCase + `Port` | `FileConverterPort` |
| Adapters | PascalCase + `Adapter` | `XlsxToCsvAdapter` |
| DTOs | PascalCase + `Dto` | `ConversionJobDto` |
| Arquivos | kebab-case | `convert-file.use-case.ts` |
| Constantes | SCREAMING_SNAKE | `MAX_FILE_SIZE_MB` |

Ordem de imports: builtins → externos → `@/domain` `@/application` `@/infrastructure` `@/app`
→ relativos. O `pnpm check` organiza imports automaticamente (Biome).

## Lint & Format — Biome

Este projeto usa **Biome** (`biome.json`), não ESLint nem Prettier. Domains `next` e `react`
habilitados; diretivas Tailwind habilitadas no parser CSS. Rode `pnpm check` antes de commitar.

## Git — Conventional Commits & Branches

Trunk-based: `main` é a única branch permanente (protegida, só via PR). Nunca commitar direto em `main`.

- **Branch:** `<type>/<scope>/<short-description>` (kebab-case, imperativo) —
  ex.: `feat/conversion/xlsx-to-csv-adapter`.
- **Commit:** `<type>(<scope>): <description>` em imperativo —
  ex.: `feat(conversion): add xlsx to csv adapter`.
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scopes:** `conversion`, `auth`, `ui`, `api`, `infra`, `catalog`, `ffmpeg`, `deps`, `ci`, `docs`.
- Commits atômicos (um propósito). Deploy de produção via tag `v*`.

## Limites & segurança

- Documentos/dados: 10 MB · Vídeo: 100 MB / 15 min. Arquivos temporários com TTL (padrão 1h).
- Validar magic bytes (não só extensão), sanitizar nomes (sem path traversal), rejeitar executáveis disfarçados.
- Firebase Admin SDK apenas no server. Cookie de sessão `__session` (httpOnly).

## Testes

Domain: unit puro · Application: unit com mocks de ports · Infrastructure: integração
(ffmpeg, sample files) · Presentation: E2E (Playwright).
