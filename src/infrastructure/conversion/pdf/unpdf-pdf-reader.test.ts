import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UnpdfPdfReader } from "./unpdf-pdf-reader";

// Reaproveita a fixture do conversor pdf→txt ("Hello Da Vinci").
const fixture = new Uint8Array(
  readFileSync(join(__dirname, "..", "converters", "__fixtures__", "hello.pdf")),
);

describe("UnpdfPdfReader (integração)", () => {
  it("lê o total de páginas e uma amostra de texto", async () => {
    const preview = await new UnpdfPdfReader().read(fixture);

    expect(preview.pageCount).toBeGreaterThanOrEqual(1);
    expect(preview.textSample).toContain("Hello Da Vinci");
  });
});
