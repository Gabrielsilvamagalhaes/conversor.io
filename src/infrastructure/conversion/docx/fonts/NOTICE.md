# Roboto — atribuição de licença

Os arquivos `Roboto-*.ttf` neste diretório são a família tipográfica **Roboto**, de Christian
Robertson, distribuída sob a **Apache License 2.0**. Foram copiados do pacote
[`pdfmake`](https://github.com/bpampuch/pdfmake) (`node_modules/pdfmake/fonts/Roboto/`), que
os embute sob a mesma licença.

Texto integral da licença: <https://www.apache.org/licenses/LICENSE-2.0>

## Por que as fontes estão versionadas no repositório

O `pdfmake` precisa do **caminho em disco** dos arquivos de fonte para gerar o PDF em Node.
A rota natural seria `require.resolve("pdfmake/package.json")`, mas tanto o Turbopack quanto
o webpack reescrevem `require.resolve(<literal>)` para um id numérico de módulo — útil para
`require`, e fatal para quem precisa do caminho real. O resultado era um `pnpm build` que
quebrava em "Collecting page data" com
`TypeError: The "path" argument must be of type string. Received type number`.

Manter as fontes na árvore e resolvê-las com `new URL(..., import.meta.url)` é o padrão que
os dois bundlers reconhecem como asset estático: o arquivo é copiado para o output e o
caminho resolvido corretamente. Ver `../converters/docx-to-pdf.adapter.ts` e
`/docs/01 - Arquitetura/Decisão - Conversão docx para pdf sem LibreOffice.md`.

## Postmortem — `new URL` com template dinâmico colapsa os assets

Este arquivo já morou dentro de `Roboto/`, junto dos 4 `.ttf`. Uma versão anterior de
`fontPath()` (em `docx-to-pdf.adapter.ts`) resolvia o caminho com um **template dinâmico**:

```ts
function fontPath(fileName: string): string {
  return fileURLToPath(new URL(`../docx/fonts/Roboto/${fileName}`, import.meta.url));
}
```

Turbopack e webpack só reconhecem `new URL(caminho, import.meta.url)` como referência a um
asset estático quando o primeiro argumento é uma **string literal** analisável em tempo de
build. Com um template (`` `.../${fileName}` ``), o bundler não consegue saber qual arquivo é
referenciado e colapsa as 4 chamadas em um **único** asset "vencedor" da pasta `Roboto/` — em
builds recentes esse vencedor era este `NOTICE.md` (pdfkit tentava ler Markdown como fonte e
fontkit lançava `Unknown font format`); em builds anteriores era `Roboto-Italic.ttf`, um bug
silencioso, sem erro nenhum: o PDF inteiro saía em itálico.

O fix (ver `../roboto-font-paths.ts`) usa uma chamada `new URL` por estilo, cada uma com
caminho literal — e move este NOTICE.md para fora de `Roboto/`, para que a pasta contenha
**só** os 4 `.ttf`: mesmo que um bundler futuro volte a colapsar os assets, o "vencedor" pelo
menos é uma fonte, não um arquivo de texto.

**Lição:** caminho passado a `new URL(..., import.meta.url)` tem que ser sempre uma string
literal. Nunca um template dinâmico, nunca uma variável.
