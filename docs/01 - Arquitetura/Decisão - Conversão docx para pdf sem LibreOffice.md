# Decisão — Conversão docx → pdf sem LibreOffice

Registro de decisão de arquitetura do [[Projeto Com Hans]]. Refere-se ao par `docx → pdf`
de [[MVP - Conversões Iniciais]] e [[Matriz de Conversões]].

- **Data:** 2026-07-25
- **Status:** Decidido e implementado — `docx → pdf` é `live: true` no catálogo
- **Contexto:** [[Contexto Conversão de Arquivos]] · [[Ambientes e Deploy]] ·
  [[Processamento de Arquivos]]

## Contexto

`docx → pdf` é um dos pares do MVP. A abordagem óbvia — converter via **LibreOffice**
(`soffice --headless --convert-to pdf`) — é a que a doc de [[Progressão Mensal]] original
listava como ferramenta e a que [[Ambientes e Deploy]] previa como pré-requisito local
(`soffice` no PATH). O problema: produção roda em **Vercel serverless**
([[Decisão - Storage Temporário e TTL]]), que não tem LibreOffice instalado nem permite
instalar um binário desse porte na função — não é `npm install`, é um pacote de sistema de
centenas de MB. Rodar `docx → pdf` em produção exigia sair do modelo serverless.

## Decisão

Reconstruir o PDF a partir do conteúdo do `.docx`, em JavaScript puro, sem depender de
nenhum binário externo:

1. **mammoth** extrai o `.docx` para HTML (mapeia estilos do Word para tags HTML
   semânticas — títulos, parágrafos, listas, tabelas, negrito/itálico).
2. Um **mapper próprio** (`src/infrastructure/conversion/docx/html-to-pdfmake.ts`) percorre
   esse HTML via **htmlparser2** (parser SAX orientado a eventos — nunca monta uma árvore
   DOM completa em memória) e monta uma `docDefinition` do **pdfmake**. Tags desconhecidas
   têm os filhos promovidos ao nível do pai em vez de derrubar a conversão; o mapper nunca
   lança — HTML vazio ou malformado sempre produz ao menos um parágrafo vazio.
3. **pdfmake** renderiza o PDF final no servidor, com a fonte **Roboto** (Apache-2.0,
   embutida no próprio pacote pdfmake) para suportar acentuação pt-BR.

Resultado: `docx → pdf` roda dentro de uma função serverless comum, sem container, sem
processo externo, sem fila.

### Limite de fidelidade assumido

O layout é **reconstruído, não replicado**. O que é preservado: texto, títulos, listas e
tabelas. O que **não** é preservado: fontes originais do documento (tudo sai em Roboto),
colunas, caixas de texto, cabeçalho/rodapé, e o posicionamento exato do Word. Isso é
diferente de rodar LibreOffice, que produz um PDF quase pixel-a-pixel igual ao `.docx`
original. A UI comunica esse limite ao usuário antes da conversão — microcopy honesta, não
letra miúda.

## Alternativas descartadas

- **LibreOffice em serviço externo** (container próprio rodando `soffice`, atrás de uma
  fila) — daria fidelidade quase perfeita (mesmo motor que o Word usa como referência de
  compatibilidade), mas muda a arquitetura de deploy inteira: exige um container long-lived
  fora da Vercel, uma fila de jobs (conversão deixa de ser síncrona), e um segredo de API
  para autenticar a função serverless contra esse serviço. Desproporcional para o volume e
  o estágio atual do produto — reavaliar se um dia a fidelidade de layout virar requisito.
- **`html-to-pdfmake` (pacote npm) + jsdom** — resolveria o mesmo problema (HTML → pdfmake)
  sem escrever o mapper à mão, mas depende de jsdom para parsear o HTML como DOM: ~3 MB de
  dependência e custo de cold start em toda invocação serverless (jsdom monta um `document`
  completo por chamada). O mapper próprio com htmlparser2 (SAX, sem DOM) é mais código
  nosso, mas sem esse custo por request — decisivo em serverless, onde cold start é custo
  direto de latência e de fatura.

## Armadilha de bundling — `require.resolve` e fontes estáticas

pdfmake precisa do caminho em disco dos arquivos `.ttf` da fonte Roboto (`setFonts` recebe
paths, não buffers). O padrão óbvio, `require.resolve("pdfmake/build/vfs_fonts")` ou
similar, **quebra em build**: tanto o Turbopack quanto o webpack reescrevem
`require.resolve(<literal>)` para um id de módulo numérico interno do bundler — funciona
para `require(id)`, mas não devolve mais um caminho real de arquivo no disco. Um
especificador dinâmico é rejeitado como "expressão dinâmica demais" pelos dois bundlers.
Qualquer uma das duas formas derrubava o `next build` assim que o módulo entrava no grafo
de alguma rota.

A saída: as fontes Roboto (Apache-2.0, do próprio pacote pdfmake) foram **copiadas** para
`src/infrastructure/conversion/docx/fonts/Roboto/`, e o caminho é resolvido com
`fileURLToPath(new URL("../docx/fonts/Roboto/<arquivo>", import.meta.url))`. Esse padrão —
`new URL(caminho-relativo, import.meta.url)` — é o que Turbopack e webpack reconhecem como
referência a um **asset estático**: copiam o arquivo para o output do build e resolvem o
caminho real em tempo de execução, em vez de tentar inlinar/reescrever o `require`.

`pdfmake` em si também precisa ser importado via `createRequire(import.meta.url)` em vez de
`import * as pdfMake from "pdfmake"`: é um singleton CJS com estado mutável, e o interop ESM
do bundler devolve um objeto de namespace somente-leitura — `pdfMake.setFonts(...)` falha
porque `this` dentro do método aponta para esse namespace congelado, não para o singleton
real.

## Postmortem — o `fontPath` dinâmico e o colapso dos 4 assets

A armadilha descrita acima (`require.resolve` dinâmico) foi contornada corretamente desde o
início com `new URL(...)`. O bug real apareceu numa variação mais sutil do mesmo padrão: o
caminho resolvido por `new URL()` **continuava sendo montado com um template dinâmico**,
ainda que o `new URL(` em si estivesse correto:

```ts
function fontPath(fileName: string): string {
  return fileURLToPath(new URL(`../docx/fonts/Roboto/${fileName}`, import.meta.url));
}
```

Turbopack e webpack só reconhecem `new URL(caminho, import.meta.url)` como referência a um
**asset estático** quando o primeiro argumento é uma string literal analisável em tempo de
build — o bundler precisa "ler" o caminho exato para saber qual arquivo copiar para o
output. Com um template (`` `${fileName}` ``), o bundler não consegue determinar
estaticamente qual dos arquivos da pasta `Roboto/` está sendo referenciado; na prática, as 4
chamadas (`normal`, `bold`, `italics`, `bolditalics`) foram todas colapsadas para o mesmo
"vencedor" resolvido da pasta, com pdfMake sobrescrevendo as 4 variantes com um único arquivo.

**Duas fases do mesmo bug, dois sintomas diferentes:**

- **Antes de `fonts/Roboto/NOTICE.md` existir na pasta:** o "vencedor" do colapso era
  `Roboto-Italic.ttf`. Nenhum erro, nenhum log, nenhum teste vermelho — o PDF gerado
  simplesmente saía inteiro em itálico (negrito e regular também renderizavam com o glyph
  itálico), porque as 4 chaves de `setFonts` apontavam para o mesmo arquivo. Esse foi o
  estado real do bug por semanas: silencioso, sem crash, só visualmente errado — o tipo de
  regressão mais perigoso porque não bloqueia deploy nem CI.
- **Depois que `fonts/Roboto/NOTICE.md` (do pacote pdfmake) passou a existir na mesma
  pasta:** o "vencedor" virou `NOTICE.md` (ordem alfabética/de listagem da pasta colocou o
  Markdown na frente dos `.ttf`). Aí sim veio um erro — mas um erro enganoso: pdfkit lia o
  conteúdo do Markdown como se fosse a fonte, fontkit lançava `Unknown font format`. A causa
  raiz (bundler colapsando os 4 `new URL` dinâmicos) ficou obscurecida atrás de uma mensagem
  que parecia sobre parsing de fonte, não sobre bundling.

O teste unitário de `docx-to-pdf.adapter.ts` (round-trip com fixture `.docx`) nunca pegou
nenhuma das duas fases: o Vitest roda os módulos diretamente em Node, sem Turbopack/webpack
no caminho — `new URL()` com template resolve perfeitamente bem fora de um bundler. O bug só
existe **depois** que o `next build` processa o módulo, um ambiente que o teste unitário não
reproduz.

### Regra que fica

**`new URL(caminho, import.meta.url)` só com string literal — nunca um template dinâmico
(`` `${...}` ``).** O motivo, resumido: o bundler precisa ler o caminho em tempo de build
para decidir copiar o arquivo como asset; qualquer parte dinâmica do primeiro argumento e
ele deixa de conseguir fazer essa análise estática, e o comportamento resultante (qual
arquivo "vence") vira um detalhe de implementação do bundler, não algo que o código controla.

### Três camadas de proteção adotadas

Nenhuma camada sozinha seria suficiente — cada uma cobre um ambiente que as outras não
alcançam:

1. **Invariante de runtime** (`src/infrastructure/conversion/docx/fonts/roboto-font-paths.ts`)
   — `resolveRobotoFontPaths()` resolve os 4 caminhos com `new URL()` literal e, na primeira
   chamada por processo, valida que os 4 caminhos são distintos, todos terminam em `.ttf` e
   todos têm um header sfnt válido (`00 01 00 00` / `true` / `OTTO` / `ttcf`) lido diretamente
   do arquivo em disco. Se o bundler colapsar os assets de novo (regressão futura, ou um
   bundler diferente com a mesma limitação), essa checagem falha alto e imediatamente na
   primeira conversão — nunca produz um PDF sutilmente errado sem avisar.
2. **Guard de forma do código-fonte, expresso como teste** — o mesmo bug de bundling não se
   manifesta rodando Vitest (sem bundler no caminho), então a defesa nesse nível não pode ser
   comportamental: o teste lê o texto-fonte de `roboto-font-paths.ts` e falha se encontrar
   qualquer `new URL(` cujo primeiro argumento não seja uma string literal entre aspas (rejeita
   crase e `${`). É uma regra de lint expressa como teste, documentada como tal no próprio
   arquivo de teste.
3. **Verificação dos assets emitidos em `.next/`, em CI** — as duas camadas acima protegem o
   código-fonte e o runtime, mas nenhuma inspeciona o que o `next build` de fato produziu.
   Essa camada varre `.next/` recursivamente atrás de arquivos `Roboto-*.ttf`, exige pelo menos
   4 com conteúdo distinto (por hash do conteúdo, não do nome) e todos com header sfnt válido —
   roda **depois** de `pnpm build`, nunca antes, porque inspeciona o artefato do build, não o
   código-fonte.

### E2E real de conversão — ainda bloqueado

O smoke E2E atual (`e2e/smoke.spec.ts`, `e2e/dashboard.spec.ts`) cobre apenas os fluxos sem
sessão: landing pública carrega, `/app` e `/dashboard` redirecionam para `/login` quando
deslogado, `/login` mostra o botão do Google. Não existe hoje um E2E que faça login de
verdade e exercite `POST /api/convert` fim a fim (upload → conversão → resposta) — inclusive
para `docx → pdf`. O bloqueio: `requireSession()` (`src/app/api/_lib/require-session.ts`) é
exigido nessa rota (ver [[Decisão - Observabilidade e Logs Estruturados]] e o Fase 2 do
[[Roadmap]] sobre autenticação obrigatória), e o CI (`.github/workflows/ci.yml`) não tem
segredos do Firebase configurados para autenticar um usuário de teste — por isso o job de
E2E é `continue-on-error: true`, não-bloqueante. Uma fixture de auth para CI (usuário de
teste + credenciais do Firebase como secret do GitHub Actions, ou um adapter de sessão
fake só para E2E) é pré-requisito para fechar essa lacuna; não faz parte desta sprint.
