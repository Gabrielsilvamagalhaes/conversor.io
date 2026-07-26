import { describe, expect, it } from "vitest";
import { buildDocDefinition, htmlToPdfContent } from "./html-to-pdfmake";

describe("htmlToPdfContent", () => {
  it("HTML vazio vira um único parágrafo vazio", () => {
    expect(htmlToPdfContent("")).toEqual([{ text: "" }]);
  });

  it("mapeia h1/h2/h3 para os estilos heading1..3", () => {
    const content = htmlToPdfContent("<h1>Título</h1><h2>Subtítulo</h2><h3>Seção</h3>");
    expect(content).toEqual([
      { text: ["Título"], style: "heading1" },
      { text: ["Subtítulo"], style: "heading2" },
      { text: ["Seção"], style: "heading3" },
    ]);
  });

  it("parágrafo simples vira um bloco de texto", () => {
    expect(htmlToPdfContent("<p>Olá mundo</p>")).toEqual([{ text: ["Olá mundo"] }]);
  });

  it("negrito e itálico aninhados preservam a estrutura", () => {
    const content = htmlToPdfContent(
      "<p>Normal <strong>negrito <em>e itálico</em></strong> fim</p>",
    );
    expect(content).toEqual([
      {
        text: [
          "Normal ",
          { text: ["negrito ", { text: ["e itálico"], italics: true }], bold: true },
          " fim",
        ],
      },
    ]);
  });

  it("<b>/<i>/<u> têm o mesmo efeito que strong/em + sublinhado", () => {
    const content = htmlToPdfContent("<p><b>b</b> <i>i</i> <u>u</u></p>");
    expect(content).toEqual([
      {
        text: [
          { text: ["b"], bold: true },
          " ",
          { text: ["i"], italics: true },
          " ",
          { text: ["u"], decoration: "underline" },
        ],
      },
    ]);
  });

  it("<br> vira quebra de linha (\\n) dentro do parágrafo", () => {
    expect(htmlToPdfContent("<p>linha 1<br>linha 2</p>")).toEqual([
      { text: ["linha 1", "\n", "linha 2"] },
    ]);
  });

  it("<a href> vira link", () => {
    const content = htmlToPdfContent('<p><a href="https://example.com">site</a></p>');
    expect(content).toEqual([{ text: [{ text: ["site"], link: "https://example.com" }] }]);
  });

  it("lista não ordenada aninhada até 3 níveis", () => {
    const html = `
      <ul>
        <li>Item 1
          <ul>
            <li>Item 1.1
              <ul>
                <li>Item 1.1.1</li>
              </ul>
            </li>
          </ul>
        </li>
        <li>Item 2</li>
      </ul>
    `;
    const content = htmlToPdfContent(html);
    expect(content).toEqual([
      {
        ul: [
          {
            stack: [
              { text: ["Item 1"] },
              {
                ul: [
                  {
                    stack: [{ text: ["Item 1.1"] }, { ul: [{ text: ["Item 1.1.1"] }] }],
                  },
                ],
              },
            ],
          },
          { text: ["Item 2"] },
        ],
      },
    ]);
  });

  it("lista ordenada vira { ol: [...] }", () => {
    const content = htmlToPdfContent("<ol><li>Um</li><li>Dois</li></ol>");
    expect(content).toEqual([{ ol: [{ text: ["Um"] }, { text: ["Dois"] }] }]);
  });

  it("tabela vira { table: { body }, layout: lightHorizontalLines }", () => {
    const html =
      "<table><tr><th>Nome</th><th>Idade</th></tr><tr><td>Ana</td><td>30</td></tr></table>";
    const content = htmlToPdfContent(html);
    expect(content).toEqual([
      {
        table: {
          body: [
            [{ text: ["Nome"] }, { text: ["Idade"] }],
            [{ text: ["Ana"] }, { text: ["30"] }],
          ],
        },
        layout: "lightHorizontalLines",
      },
    ]);
  });

  it("imagem png em data URI é aceita", () => {
    const src = "data:image/png;base64,iVBORw0KGgo=";
    const content = htmlToPdfContent(`<img src="${src}">`);
    expect(content).toHaveLength(1);
    expect(content[0]).toMatchObject({ image: src });
  });

  it("imagem jpeg em data URI é aceita", () => {
    const src = "data:image/jpeg;base64,/9j/4AAQ";
    const content = htmlToPdfContent(`<img src="${src}">`);
    expect(content[0]).toMatchObject({ image: src });
  });

  it("imagem svg (ou outro formato) é ignorada silenciosamente", () => {
    const src = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    expect(htmlToPdfContent(`<p>antes</p><img src="${src}"><p>depois</p>`)).toEqual([
      { text: ["antes"] },
      { text: ["depois"] },
    ]);
  });

  it("tag desconhecida é ignorada, mas os filhos são processados", () => {
    const content = htmlToPdfContent(
      "<div><p>dentro de div</p></div><custom-tag>solto</custom-tag>",
    );
    expect(content).toEqual([{ text: ["dentro de div"] }, { text: ["solto"] }]);
  });

  it("espaços em branco redundantes são colapsados", () => {
    const html = "<p>muitos    espaços\n\n   aqui</p>";
    expect(htmlToPdfContent(html)).toEqual([{ text: ["muitos espaços aqui"] }]);
  });

  it("entidades HTML são decodificadas", () => {
    expect(htmlToPdfContent("<p>A &amp; B &lt;3&gt;</p>")).toEqual([{ text: ["A & B <3>"] }]);
  });

  it("<script> é descartado junto com o conteúdo, não promovido como texto", () => {
    const content = htmlToPdfContent("<script>alert(1)</script><p>Olá</p>");
    expect(content).toEqual([{ text: ["Olá"] }]);
    expect(JSON.stringify(content)).not.toContain("alert(1)");
  });

  it("<style> é descartado junto com o conteúdo, não promovido como texto", () => {
    const content = htmlToPdfContent("<style>.a { color: red; }</style><p>Olá</p>");
    expect(content).toEqual([{ text: ["Olá"] }]);
    expect(JSON.stringify(content)).not.toContain("color: red");
  });
});

describe("buildDocDefinition", () => {
  it("monta a docDefinition com estilos, margens e defaultStyle esperados", () => {
    const doc = buildDocDefinition("<h1>Olá</h1>");

    expect(doc.content).toEqual([{ text: ["Olá"], style: "heading1" }]);
    expect(doc.pageMargins).toEqual([48, 56, 48, 56]);
    expect(doc.defaultStyle).toEqual({ fontSize: 11, lineHeight: 1.35 });
    expect(doc.styles).toEqual({
      heading1: { fontSize: 18, bold: true, marginBottom: 8 },
      heading2: { fontSize: 15, bold: true, marginBottom: 6 },
      heading3: { fontSize: 13, bold: true, marginBottom: 4 },
    });
  });

  it("nunca lança para HTML vazio", () => {
    expect(() => buildDocDefinition("")).not.toThrow();
    expect(buildDocDefinition("").content).toEqual([{ text: "" }]);
  });
});
