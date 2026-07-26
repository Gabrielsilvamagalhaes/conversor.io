# Design — Sprint formatos novos (imagens + md→pdf) e landing a partir do catálogo

- **Data:** 2026-07-25
- **Status:** Em implementação (sprint paralela, múltiplas tasks)
- **Contexto bounded:** Conversão (novo par + nova categoria) · Presentation (landing)

## 1. Objetivo

Três frentes paralelas na mesma sprint:

1. **Fix crítico de `docx → pdf`** — o `fontPath` que resolve as 4 variantes da fonte Roboto
   usava um template dinâmico dentro de `new URL(..., import.meta.url)`. Turbopack/webpack só
   tratam essa chamada como asset estático quando o caminho é literal; com template, o
   bundler colapsava as 4 chamadas num único arquivo. Antes de `fonts/Roboto/NOTICE.md`
   existir na pasta, o "vencedor" do colapso era `Roboto-Italic.ttf` — bug silencioso, PDF
   inteiro saía em itálico, sem erro, por semanas. Depois que `NOTICE.md` passou a existir na
   mesma pasta, o vencedor virou o Markdown e a conversão passou a falhar alto (`Unknown font
   format` no fontkit) — errado, mas ao menos visível. Ver o postmortem completo em
   [[Decisão - Conversão docx para pdf sem LibreOffice]].
2. **Formatos novos** — categoria `images` no domínio (`png`, `jpg`/`jpeg`, `webp`) com 6
   pares via **sharp**, e `md → pdf` via **marked** reaproveitando o mapper
   `html-to-pdfmake.ts` e o singleton pdfmake que já serviam `docx → pdf`. Catálogo sai de 14
   para 21 pares. Ver [[Matriz de Conversões]] e
   [[Decisão - Conversão de imagens com sharp]].
3. **Landing reestruturada** — lê o catálogo real via `GetConversionCatalogUseCase` em vez de
   listas hardcoded. Antes desta sprint havia cópias hardcoded e desatualizadas da lista de
   formatos em mais de um componente (ex.: `src/app/page.tsx` e `src/components/site-footer.tsx`
   listavam `docx → pdf` como `live: false`, o que já estava errado desde a Fase 1).

## 2. Decisões e porquês

### 2.1 `new URL(..., import.meta.url)` — só literal, nunca template

Regra adotada em todo o código, não só no `docx-to-pdf.adapter.ts` original: o primeiro
argumento de `new URL()` usado para referenciar um asset precisa ser uma string literal.
Porquê: o bundler resolve esse asset em tempo de build lendo o caminho estaticamente; uma
parte dinâmica (`` `${...}` ``) impede essa leitura e o comportamento resultante (qual
arquivo "vence") vira um detalhe de implementação do bundler, não do código. Três camadas de
proteção foram adotadas para essa invariante especificamente em torno da fonte Roboto —
runtime (`roboto-font-paths.ts`), guard de forma do código-fonte em teste
(`roboto-font-paths.test.ts`) e verificação dos assets emitidos em `.next/` em CI
(`scripts/verify-font-assets.mjs`, via `pnpm verify:assets`) — ver o postmortem para o
detalhe de cada uma.

### 2.2 sharp em vez de jimp ou @napi-rs/image

sharp foi escolhida por já ser a lib de imagem madura de referência no Node, com PNG/JPEG/WebP
nativos e sem carregar a imagem inteira em memória. jimp foi descartada por ser JS puro (mais
lenta, sem streaming, WebP só via plugin); `@napi-rs/image` foi descartada por maturidade
menor. Detalhe completo, incluindo o risco de deploy do binário nativo por plataforma
(lockfile gerado no Windows, build na Vercel em linux-x64, mitigado por `.npmrc` com
`supportedArchitectures`) em [[Decisão - Conversão de imagens com sharp]].

### 2.3 `ImageConvertAdapter` parametrizado, não 6 adapters

Desvio consciente da convenção "1 par = 1 adapter" do `CLAUDE.md`: os 6 pares de imagem são a
mesma operação (decode → re-encode) variando só o codec de saída, então um único adapter
parametrizado — instanciado 6× a partir do catálogo — evita duplicar a mesma sequência de
chamadas do sharp seis vezes. Só é possível porque `FileConverterPort` declara `from`/`to`
como campos de instância, não como literal type fixo por classe.

### 2.4 `md → pdf` reaproveita o pipeline de `docx → pdf`

Em vez de escrever um mapper novo, `md → pdf` converte Markdown → HTML via marked e entra no
mesmo `html-to-pdfmake.ts` (htmlparser2 → docDefinition do pdfmake) e no mesmo singleton
pdfmake (extraído para `src/infrastructure/conversion/pdfmake/pdfmake-instance.ts` nesta
sprint, justamente para ser compartilhável entre os dois adapters). Reaproveita também a
fonte Roboto e a validação de assets descrita em 2.1.

### 2.5 Landing lê o catálogo, não hardcode

A landing (`src/app/page.tsx`) e o rodapé (`src/components/site-footer.tsx`) tinham cada um
sua própria lista estática de pares — pelo menos uma delas já desatualizada (`docx → pdf`
marcado como "em breve" quando já era `live` desde a Fase 1). A correção estrutural é a
landing consumir `GetConversionCatalogUseCase` (o mesmo DTO que a área `/app` já usa),
eliminando a possibilidade de a home divergir do catálogo real.

## 3. Escopo entregue

- Fix do `fontPath` do `docx → pdf` (item 2.1), com as três camadas de proteção.
- Categoria `images` no domínio + 6 pares via `ImageConvertAdapter` (sharp).
- `.jpeg` como alias normalizado de `.jpg`.
- `md → pdf` via `MarkdownToPdfAdapter` (marked) reaproveitando o pipeline pdfmake.
- Landing reestruturada lendo o catálogo real.
- `.npmrc` com `supportedArchitectures` para o binário nativo do sharp resolver em CI/deploy
  na Vercel (linux-x64) mesmo com lockfile gerado no Windows.

## 4. Explicitamente fora de escopo

- **Fixture de auth para E2E** — não há hoje um E2E que faça login real e exercite
  `POST /api/convert` fim a fim; o CI não tem segredos do Firebase configurados. Ver o
  postmortem em [[Decisão - Conversão docx para pdf sem LibreOffice]].
- **Upload direto para storage** — segue adiado para a Fase 3 (ver
  [[Decisão - Storage Temporário e TTL]]); esta sprint não muda o modelo síncrono
  bytes-entram-bytes-saem-na-mesma-request.
- **`<pre><code>` com whitespace preservado no `html-to-pdfmake`** — o mapper de
  `docx`/`md → pdf` não tem as tags `pre`/`code` na lista de tags conhecidas
  (`KNOWN_TAGS` em `html-to-pdfmake.ts`); um bloco de código em Markdown ou docx tem seus
  filhos promovidos ao nível do pai e a formatação/indentação original não é preservada.
- **Limite de tamanho** — o teto de upload de documentos/dados (`DEFAULT_MAX_DOCUMENT_SIZE_MB`,
  hoje 4 MB, abaixo do teto de body de função serverless da Vercel) segue valendo também para
  a categoria `images` — não foi criado um limite maior específico para imagem. Mitigação
  prevista para o lado do usuário: downscale da imagem no navegador antes do upload, para
  fotos de celular que hoje frequentemente excedem 4 MB brutos — não implementado nesta
  sprint (fica para a UI de imagem, task separada).
