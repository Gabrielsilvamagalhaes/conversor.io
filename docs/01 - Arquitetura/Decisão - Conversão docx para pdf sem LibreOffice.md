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
