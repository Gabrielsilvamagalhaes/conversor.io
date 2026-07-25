import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import { DocxToPdfAdapter } from "./docx-to-pdf.adapter";

// hello.docx: h1, parágrafo com acentuação pt-BR + negrito/itálico, lista de 2 itens.
// (gerado a partir das partes OOXML mínimas — ver relatório da tarefa para detalhes.)
const fixture = new Uint8Array(readFileSync(join(__dirname, "__fixtures__", "hello.docx")));

describe("DocxToPdfAdapter (integração)", () => {
  it("produz bytes de PDF válidos", async () => {
    const out = await new DocxToPdfAdapter().convert(fixture);

    expect(out.length).toBeGreaterThan(0);
    const header = new TextDecoder("ascii").decode(out.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("preserva a acentuação pt-BR no texto extraído do PDF gerado", async () => {
    const out = await new DocxToPdfAdapter().convert(fixture);

    const pdf = await getDocumentProxy(out);
    const { text } = await extractText(pdf, { mergePages: true });

    expect(text).toContain("Conversão");
    expect(text).toContain("José");
  });
});
