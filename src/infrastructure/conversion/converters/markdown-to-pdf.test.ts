import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import { InvalidFileTypeError } from "@/domain/conversion/errors/invalid-file-type.error";
import { MarkdownToPdfAdapter } from "./markdown-to-pdf.adapter";

const encode = (markdown: string): Uint8Array => new TextEncoder().encode(markdown);

const SAMPLE = `# Conversão de documentos

Parágrafo com **negrito**, *itálico* e acentuação: José, ação, você.

- Primeiro item
- Segundo item
`;

async function textOf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

describe("MarkdownToPdfAdapter (integração)", () => {
  it("produz bytes de PDF válidos", async () => {
    const out = await new MarkdownToPdfAdapter().convert(encode(SAMPLE));

    expect(out.length).toBeGreaterThan(0);
    expect(new TextDecoder("ascii").decode(out.slice(0, 5))).toBe("%PDF-");
  });

  it("preserva heading, lista e acentuação pt-BR no texto extraído", async () => {
    const text = await textOf(await new MarkdownToPdfAdapter().convert(encode(SAMPLE)));

    // Acentuação correta prova que a fonte Roboto foi resolvida — com a fonte errada ou ausente
    // o pdfmake falharia ou trocaria os glifos acentuados.
    expect(text).toContain("Conversão");
    expect(text).toContain("José");
    expect(text).toContain("você");
    expect(text).toContain("negrito");
    expect(text).toContain("Primeiro item");
    expect(text).toContain("Segundo item");
  });

  it("descarta HTML embutido em <script> em vez de imprimi-lo como texto", async () => {
    const markdown = "<script>alert(1)</script>\n\n# Documento limpo\n";

    const text = await textOf(await new MarkdownToPdfAdapter().convert(encode(markdown)));

    expect(text).toContain("Documento limpo");
    expect(text).not.toContain("alert(1)");
  });

  it("aceita markdown com BOM UTF-8", async () => {
    const text = await textOf(await new MarkdownToPdfAdapter().convert(encode(`﻿# Título`)));

    expect(text).toContain("Título");
  });

  it("rejeita bytes que não são UTF-8 válido", async () => {
    // 0xC3 inicia uma sequência de 2 bytes que nunca é completada.
    const invalid = new Uint8Array([0xc3, 0x28, 0xa0, 0xa1]);

    await expect(new MarkdownToPdfAdapter().convert(invalid)).rejects.toBeInstanceOf(
      InvalidFileTypeError,
    );
  });
});
