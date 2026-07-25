import { Parser } from "htmlparser2";
import type { Content, StyleDictionary, TDocumentDefinitions } from "pdfmake/interfaces";

/** Alias local para o tipo de conteúdo do pdfmake — mantém o nome pedido pela spec da tarefa. */
export type PdfContent = Content;

/** Nó de texto da árvore HTML mínima montada a partir dos eventos SAX do htmlparser2. */
interface HtmlTextNode {
  readonly type: "text";
  readonly value: string;
}

/** Nó de elemento da árvore HTML mínima montada a partir dos eventos SAX do htmlparser2. */
interface HtmlElementNode {
  readonly type: "element";
  readonly tag: string;
  readonly attribs: Readonly<Record<string, string>>;
  readonly children: HtmlNode[];
}

type HtmlNode = HtmlTextNode | HtmlElementNode;

/** Tags que o mapper entende. Qualquer outra é "desconhecida": seus filhos são promovidos ao nível do pai. */
const KNOWN_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "img",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "br",
]);

const BLOCK_TAGS = new Set(["h1", "h2", "h3", "p", "ul", "ol", "table", "img"]);

/** Largura/altura úteis da página A4 com `pageMargins: [48, 56, 48, 56]` — usadas como teto do `fit` de imagens. */
const IMAGE_FIT: [number, number] = [499, 729];

const STYLES: StyleDictionary = {
  heading1: { fontSize: 18, bold: true, marginBottom: 8 },
  heading2: { fontSize: 15, bold: true, marginBottom: 6 },
  heading3: { fontSize: 13, bold: true, marginBottom: 4 },
};

/**
 * Converte o HTML produzido pelo mammoth (`docx` → html) numa `docDefinition` do pdfmake.
 * Nunca lança: HTML vazio ou malformado sempre produz uma docDefinition válida (parágrafo vazio).
 */
export function buildDocDefinition(html: string): TDocumentDefinitions {
  return {
    content: htmlToPdfContent(html),
    styles: STYLES,
    defaultStyle: { fontSize: 11, lineHeight: 1.35 },
    pageMargins: [48, 56, 48, 56],
  };
}

/** Converte o HTML em uma lista de blocos de conteúdo do pdfmake. Nunca lança. */
export function htmlToPdfContent(html: string): PdfContent[] {
  try {
    const root = parseHtml(html);
    const flat = flattenUnknownTags(root.children);
    const content = convertBlockChildren(flat);
    return content.length > 0 ? content : [{ text: "" }];
  } catch {
    // Robustez: qualquer falha inesperada de parsing/mapeamento vira um parágrafo vazio,
    // nunca uma exceção — quem chama não precisa lidar com HTML "impossível de converter".
    return [{ text: "" }];
  }
}

/** Monta a árvore mínima (elemento/texto) a partir do HTML via parser SAX do htmlparser2 — sem DOM. */
function parseHtml(html: string): HtmlElementNode {
  const root: HtmlElementNode = { type: "element", tag: "root", attribs: {}, children: [] };
  const stack: HtmlElementNode[] = [root];

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const node: HtmlElementNode = { type: "element", tag: name, attribs, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      },
      ontext(data) {
        // Entidades HTML (`&amp;`, `&lt;`...) chegam como um `ontext` por caractere decodificado
        // — funde no nó de texto anterior para não fragmentar "A & B" em vários runs.
        const siblings = stack[stack.length - 1].children;
        const last = siblings[siblings.length - 1];
        if (last && last.type === "text") {
          siblings[siblings.length - 1] = { type: "text", value: last.value + data };
        } else {
          siblings.push({ type: "text", value: data });
        }
      },
      onclosetag() {
        if (stack.length > 1) stack.pop();
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
  );
  parser.end(html);

  return root;
}

/** Promove os filhos de tags desconhecidas ao nível do pai; ignora só a tag em si, recursivamente. */
function flattenUnknownTags(nodes: HtmlNode[]): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      out.push(node);
    } else if (KNOWN_TAGS.has(node.tag)) {
      out.push({ ...node, children: flattenUnknownTags(node.children) });
    } else {
      out.push(...flattenUnknownTags(node.children));
    }
  }
  return out;
}

/**
 * Normaliza um nó de texto: colapsa espaços/quebras em um único espaço.
 * Texto puramente de indentação (só espaços, contendo quebra de linha) é descartado — não é
 * conteúdo, é formatação do HTML de origem. Um único espaço "de verdade" entre tags inline
 * (ex.: `<b>a</b> <b>b</b>`) é preservado.
 */
function normalizeText(raw: string): string | null {
  const collapsed = raw.replace(/[ \t\r\n\f]+/g, " ");
  if (collapsed.trim().length === 0) {
    return raw.includes("\n") ? null : collapsed;
  }
  return collapsed;
}

/** Remove espaço solto no início/fim de uma sequência de runs inline (só quando é string simples). */
function trimBoundaries(runs: PdfContent[]): PdfContent[] {
  if (runs.length === 0) return runs;
  const trimmed = [...runs];
  const first = trimmed[0];
  if (typeof first === "string") trimmed[0] = first.replace(/^\s+/, "");
  const lastIndex = trimmed.length - 1;
  const last = trimmed[lastIndex];
  if (typeof last === "string") trimmed[lastIndex] = last.replace(/\s+$/, "");
  return trimmed;
}

/** Converte filhos inline (texto solto + tags de ênfase/link/quebra) em runs de texto do pdfmake. */
function collectInline(nodes: HtmlNode[]): PdfContent[] {
  const runs: PdfContent[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      const text = normalizeText(node.value);
      if (text !== null) runs.push(text);
      continue;
    }

    switch (node.tag) {
      case "br":
        runs.push("\n");
        break;
      case "strong":
      case "b":
        runs.push({ text: collectInline(node.children), bold: true });
        break;
      case "em":
      case "i":
        runs.push({ text: collectInline(node.children), italics: true });
        break;
      case "u":
        runs.push({ text: collectInline(node.children), decoration: "underline" });
        break;
      case "a": {
        const href = node.attribs.href;
        runs.push({ text: collectInline(node.children), ...(href ? { link: href } : {}) });
        break;
      }
      default:
        // Bloco aparecendo em contexto inline (HTML malformado): degrada para o texto dos filhos.
        runs.push(...collectInline(node.children));
    }
  }
  return runs;
}

/** `collectInline` + corte das bordas — usado nos pontos "folha" (parágrafo, heading, célula, item). */
function inlineText(nodes: HtmlNode[]): PdfContent[] {
  return trimBoundaries(collectInline(nodes));
}

/** Converte uma sequência de nós no nível de bloco (parágrafos, headings, listas, tabela, imagem). */
function convertBlockChildren(nodes: HtmlNode[]): PdfContent[] {
  const result: PdfContent[] = [];
  let buffer: PdfContent[] = [];

  const flush = (): void => {
    const text = trimBoundaries(buffer);
    if (text.length > 0) result.push({ text });
    buffer = [];
  };

  for (const node of nodes) {
    if (node.type === "text") {
      const text = normalizeText(node.value);
      if (text !== null) buffer.push(text);
      continue;
    }

    if (!BLOCK_TAGS.has(node.tag)) {
      // Tag inline (strong/b/em/i/u/a/br) direto no nível de bloco: acumula no parágrafo corrente.
      buffer.push(...collectInline([node]));
      continue;
    }

    switch (node.tag) {
      case "h1":
      case "h2":
      case "h3":
        flush();
        result.push({ text: inlineText(node.children), style: `heading${node.tag.slice(1)}` });
        break;
      case "p":
        flush();
        result.push({ text: inlineText(node.children) });
        break;
      case "ul":
        flush();
        result.push(convertList(node, "ul"));
        break;
      case "ol":
        flush();
        result.push(convertList(node, "ol"));
        break;
      case "table":
        flush();
        result.push(convertTable(node));
        break;
      case "img": {
        flush();
        const image = convertImage(node);
        if (image) result.push(image);
        break;
      }
      default:
        break;
    }
  }
  flush();

  return result;
}

/** Converte `<ul>`/`<ol>` em `{ ul: [...] }` / `{ ol: [...] }`, aninhando listas dentro de `<li>`. */
function convertList(node: HtmlElementNode, kind: "ul" | "ol"): PdfContent {
  const items = listItems(node);
  return kind === "ul" ? { ul: items } : { ol: items };
}

function listItems(node: HtmlElementNode): PdfContent[] {
  return node.children
    .filter((child): child is HtmlElementNode => child.type === "element" && child.tag === "li")
    .map(convertListItem);
}

function convertListItem(li: HtmlElementNode): PdfContent {
  const isNestedList = (child: HtmlNode): child is HtmlElementNode =>
    child.type === "element" && (child.tag === "ul" || child.tag === "ol");

  const nestedLists = li.children.filter(isNestedList);
  const ownText = li.children.filter((child) => !isNestedList(child));
  const textContent: PdfContent = { text: inlineText(ownText) };

  if (nestedLists.length === 0) return textContent;

  const nested = nestedLists.map((list) => convertList(list, list.tag as "ul" | "ol"));
  return { stack: [textContent, ...nested] };
}

/** Converte `<table>` em `{ table: { body: [[...]] }, layout: "lightHorizontalLines" }`. */
function convertTable(node: HtmlElementNode): PdfContent {
  const rows: PdfContent[][] = collectTableRows(node).map((cells) =>
    cells.map((cell): PdfContent => ({ text: inlineText(cell.children) })),
  );
  const nonEmptyRows = rows.filter((row) => row.length > 0);

  if (nonEmptyRows.length === 0) {
    return { table: { body: [[{ text: "" }]] }, layout: "lightHorizontalLines" };
  }

  const columnCount = Math.max(...nonEmptyRows.map((row) => row.length));
  const rectangularRows = nonEmptyRows.map((row) => {
    const padded = [...row];
    while (padded.length < columnCount) padded.push({ text: "" });
    return padded;
  });

  return { table: { body: rectangularRows }, layout: "lightHorizontalLines" };
}

function collectTableRows(node: HtmlElementNode): HtmlElementNode[][] {
  const rows: HtmlElementNode[] = [];

  const visit = (container: HtmlElementNode): void => {
    for (const child of container.children) {
      if (child.type !== "element") continue;
      if (child.tag === "tr") rows.push(child);
      else if (child.tag === "thead" || child.tag === "tbody") visit(child);
    }
  };
  visit(node);

  return rows.map((tr) =>
    tr.children.filter(
      (cell): cell is HtmlElementNode =>
        cell.type === "element" && (cell.tag === "td" || cell.tag === "th"),
    ),
  );
}

/** Converte `<img>`: só aceita `src` como data URI png/jpeg; qualquer outro formato é ignorado. */
function convertImage(node: HtmlElementNode): PdfContent | null {
  const src = node.attribs.src;
  if (!src || !/^data:image\/(png|jpe?g);base64,/i.test(src)) return null;
  return { image: src, fit: IMAGE_FIT };
}
