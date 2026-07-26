import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "./markdown-to-html";

describe("renderMarkdownToHtml", () => {
  it("converte heading, negrito e lista para as tags HTML correspondentes", () => {
    const markdown = ["# Título", "", "Texto em **negrito**.", "", "- item um", "- item dois"].join(
      "\n",
    );

    const html = renderMarkdownToHtml(markdown);

    expect(html).toContain("<h1>Título</h1>");
    expect(html).toContain("<strong>negrito</strong>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>item um</li>");
  });

  it("preserva acentuação pt-BR", () => {
    const html = renderMarkdownToHtml("Conversão de José, com ção.");

    expect(html).toContain("Conversão");
    expect(html).toContain("José");
    expect(html).toContain("ção");
  });

  it("não converte uma quebra de linha simples em <br> (breaks: false)", () => {
    const html = renderMarkdownToHtml(["linha um", "linha dois"].join("\n"));

    expect(html).not.toContain("<br>");
  });

  it("retorna string de forma síncrona (não uma Promise)", () => {
    const result = renderMarkdownToHtml("texto simples");

    expect(typeof result).toBe("string");
  });
});
