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
caminho resolvido corretamente. Ver `../../docx-to-pdf.adapter.ts` e
`/docs/01 - Arquitetura/Decisão - Conversão docx para pdf sem LibreOffice.md`.
