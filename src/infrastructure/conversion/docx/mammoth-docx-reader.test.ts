import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MammothDocxReader } from "./mammoth-docx-reader";

const fixture = new Uint8Array(
  readFileSync(join(__dirname, "..", "converters", "__fixtures__", "hello.docx")),
);

describe("MammothDocxReader (integração)", () => {
  it("conta palavras e parágrafos e traz uma amostra de texto", async () => {
    const preview = await new MammothDocxReader().read(fixture);

    expect(preview.wordCount).toBeGreaterThan(0);
    expect(preview.paragraphCount).toBeGreaterThan(0);
    expect(preview.textSample).toContain("Conversão");
    expect(preview.truncated).toBe(false);
  });
});
