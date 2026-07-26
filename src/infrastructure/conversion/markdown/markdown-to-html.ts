import { marked } from "marked";

/**
 * Converte markdown em HTML via `marked`, na API síncrona (`async: false`) — sem plugins,
 * sem extensões. `gfm: true` habilita listas/tabelas no estilo GitHub; `breaks: false` mantém
 * a semântica padrão de quebra de linha do CommonMark (uma quebra simples não vira `<br>`).
 * O HTML resultante alimenta `buildDocDefinition` (`@/infrastructure/conversion/docx/html-to-pdfmake`),
 * o mesmo mapper usado por `docx → pdf`.
 */
export function renderMarkdownToHtml(markdown: string): string {
  return marked(markdown, { gfm: true, breaks: false, async: false });
}
