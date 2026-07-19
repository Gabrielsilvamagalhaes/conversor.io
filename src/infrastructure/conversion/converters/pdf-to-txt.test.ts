import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PdfToTxtAdapter } from "./pdf-to-txt.adapter";

// PDF mínimo com o texto "Hello Da Vinci" (ver __fixtures__/hello.pdf).
const fixture = new Uint8Array(readFileSync(join(__dirname, "__fixtures__", "hello.pdf")));

describe("PdfToTxtAdapter (integração)", () => {
  it("extrai o texto de um pdf", async () => {
    const out = await new PdfToTxtAdapter().convert(fixture);
    const text = new TextDecoder().decode(out);
    expect(text).toContain("Hello Da Vinci");
  });
});
