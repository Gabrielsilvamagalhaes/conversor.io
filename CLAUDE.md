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
| Documentos | `.docx` → `.pdf` (sem LibreOffice — mammoth + pdfmake), `.pdf` → `.txt`, `.md` → `.pdf` (marked + pdfmake) |
| Dados | `.json` ↔ `.csv`, `.xlsx` → `.json` |
| Imagens | `.png` ↔ `.jpg`, `.webp` → `.png`/`.jpg`, `.png`/`.jpg` → `.webp` (sharp) |
| Mídia | vídeo (`.mp4`/`.webm`/`.mov`) → `.mp3`/`.wav` (roda no navegador via ffmpeg.wasm) |

`.xlsx → .json` foi adicionado na Fase 2, fora do escopo fechado original do MVP — ver
`/docs/04 - Conversoes/MVP - Conversões Iniciais.md`. A categoria Imagens e `.md → .pdf`
também foram adicionadas fora desse escopo fechado, na mesma fase — ver o mesmo arquivo e
`/docs/01 - Arquitetura/Decisão - Conversão de imagens com sharp.md`. `.jpeg` é aceito como
grafia alternativa de `.jpg` (mesmo container, alias normalizado antes do catálogo).
`.pdf → .docx` está no catálogo mas ainda não é `live` ("em breve").

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
Nenhum binário externo é necessário para conversões locais: vídeo → áudio roda com
ffmpeg.wasm no navegador (não usa `ffmpeg` do sistema) e `docx → pdf`/`md → pdf` rodam em JS
puro (mammoth/marked + pdfmake, não usa LibreOffice/`soffice`).

`pnpm verify:assets` (exige `pnpm build` antes — inspeciona os arquivos emitidos em `.next/`,
não o código-fonte) confere que as 4 variantes da fonte Roboto do `docx`/`md → pdf` foram
emitidas como assets distintos pelo bundler — ver o postmortem em
[[Decisão - Conversão docx para pdf sem LibreOffice]].

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

- **Conversão** — agregado raiz `ConversionJob`; catálogo de pares. A conversão é síncrona
  (bytes entram, bytes saem na mesma request), então o job nasce **já em estado terminal**:
  só `completed` | `failed`, via as factories estáticas. Não existe `pending`/`processing`.
  `storageKey`/`expiresAt` existem no agregado mas são sempre `null` até a Fase 3.
- **Identidade** — agregado `AuthenticatedUser` (thin; Firebase é source of truth);
  resolve sessão e expõe `userId`.
- Contextos se comunicam por application services / domain events — sem acoplar agregados
  de contextos diferentes. Nunca importar `firebase-admin` dentro de `ConversionJob`.

### Conversores

Cada par de conversão server-side = **um adapter** implementando `FileConverterPort`,
registrado no `ConverterRegistry`. Ex.: `XlsxToCsvAdapter`, `DocxToPdfAdapter`. Adicionar um
formato = adicionar um adapter, sem reescrever o core. Vídeo → áudio é exceção: roda no
navegador (ffmpeg.wasm), não tem adapter nem entra no `ConverterRegistry`.

`ImageConvertAdapter` é uma exceção parametrizada a essa regra: é **um** adapter instanciado
6× a partir do catálogo (uma instância por par de imagem), não 6 classes, porque os 6 pares
são a mesma operação (decode → re-encode via sharp) variando só o codec de saída — ver
[[Decisão - Conversão de imagens com sharp]] em `/docs`.

## Estrutura de pastas (`src/`)

```
src/
├── app/              # Presentation (App Router): pages, layouts, api/route handlers, middleware
├── components/       # Presentation: componentes React · dashboard/ · dropzone/ · motion/ · landing/ · ui/
├── domain/           # conversion/ · identity/ · observability/ (entities, value-objects, errors, ports)
├── application/      # use cases por contexto + services/ (converter-registry)
├── infrastructure/   # auth/ · conversion/ (adapters de conversão) · observability/ · persistence/ (Firestore)
├── di/               # container.ts (composition root) · env.ts (validação zod)
└── shared/           # types/ · utils/ · constants/
```

`src/infrastructure/persistence/` guarda o adapter Firestore do histórico de conversões.
`src/infrastructure/observability/` e `src/domain/observability/` guardam `LoggerPort` e
`ConsoleJsonLogger` — ver [[Decisão - Observabilidade e Logs Estruturados]] em `/docs`.
Ainda não existe `src/infrastructure/storage/` (Fase 3, storage de arquivo + TTL).

Dentro de `src/infrastructure/conversion/`: `docx/` e `pdfmake/` guardam a fonte Roboto e o
singleton pdfmake compartilhados por `docx → pdf` e `md → pdf`; `image/` guarda o
`ImageConvertAdapter` (sharp); `markdown/` guarda o adapter `md → pdf` (marked). Dentro de
`src/components/`: `motion/` guarda os primitivos de animação (`motion`, respeitando
`prefers-reduced-motion`) e `landing/` guarda os componentes da página inicial, que lê o
catálogo real via `GetConversionCatalogUseCase` em vez de listas hardcoded.

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

- Documentos/dados/imagens: **4 MB** (`DEFAULT_MAX_DOCUMENT_SIZE_MB`, abaixo do teto ~4,5 MB de body
  da Vercel; ajustável por `MAX_DOCUMENT_SIZE_MB`) · Vídeo: 100 MB / 15 min, convertido no navegador.
  Imagens acima do limite são reduzidas via canvas antes do upload (`src/lib/image/downscale-image.ts`).
- Validar magic bytes (não só extensão), sanitizar nomes (sem path traversal), rejeitar executáveis disfarçados.
- Firebase Admin SDK apenas no server. Cookie de sessão `__session` (httpOnly).

## Testes

Domain: unit puro · Application: unit com mocks de ports · Infrastructure: integração
(ffmpeg, sample files) · Presentation: E2E (Playwright).

CI: `.github/workflows/ci.yml` roda `biome ci` + `typecheck` + `test` (Vitest) em cada push/PR;
E2E é job separado e não-bloqueante. Em CI use `pnpm ci` (`biome ci`, não-mutante), nunca
`pnpm check` (`--write`).

## Diretrizes de desenvolvimento

- **Testes quando fizer sentido.** Gerar testes quando forem necessários e coerentes — cobrir
  lógica de domínio/aplicação e adapters com round-trip real; não inflar com testes triviais.
- **UI/UX.** Priorizar boa experiência: hierarquia clara, estados de carregamento/erro/sucesso
  visíveis, microcopy honesta (sinalizar o que ainda não existe), acessibilidade e feedback
  animado sóbrio — sempre respeitando `prefers-reduced-motion`.
- **Processamento de arquivos.** Levar performance em conta: ler/escrever em streaming (linha a
  linha / chunks) para arquivos pesados, sem carregar tudo em memória. Revalidar no servidor
  (tamanho, magic bytes) antes de converter.
- **Tema claro e escuro.** Todo elemento novo deve funcionar nos dois temas — usar os tokens
  (`--fg/--muted/--sanguine/--gold/--line/--bg/--bg-elev`), nunca cores fixas.
- **Libs externas.** Sempre pedir permissão antes de adicionar uma dependência nova.
- **`new URL(caminho, import.meta.url)` só com string literal, nunca template dinâmico**
  (`` `${...}` ``). Turbopack e webpack só reconhecem essa chamada como referência a um asset
  estático quando conseguem ler o caminho em tempo de build; com uma parte dinâmica, o
  bundler não sabe qual arquivo copiar e colapsa múltiplas chamadas no mesmo asset — ver o
  postmortem em [[Decisão - Conversão docx para pdf sem LibreOffice]].
