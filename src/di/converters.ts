import { ConverterRegistry } from "@/application/conversion/services/converter-registry";
import type { FileConverterPort } from "@/domain/conversion/ports/file-converter.port";
import { isImageExtension } from "@/domain/conversion/value-objects/accepted-format";
import { CONVERSION_PAIRS } from "@/domain/conversion/value-objects/conversion-pair";
import { CsvToJsonAdapter } from "@/infrastructure/conversion/converters/csv-to-json.adapter";
import { CsvToXlsxAdapter } from "@/infrastructure/conversion/converters/csv-to-xlsx.adapter";
import { DocxToPdfAdapter } from "@/infrastructure/conversion/converters/docx-to-pdf.adapter";
import { ImageConvertAdapter } from "@/infrastructure/conversion/converters/image-convert.adapter";
import { JsonToCsvAdapter } from "@/infrastructure/conversion/converters/json-to-csv.adapter";
import { MarkdownToPdfAdapter } from "@/infrastructure/conversion/converters/markdown-to-pdf.adapter";
import { PdfToTxtAdapter } from "@/infrastructure/conversion/converters/pdf-to-txt.adapter";
import { XlsxToCsvAdapter } from "@/infrastructure/conversion/converters/xlsx-to-csv.adapter";
import { XlsxToJsonAdapter } from "@/infrastructure/conversion/converters/xlsx-to-json.adapter";

/**
 * Os 6 pares de imagem são derivados do catálogo em vez de listados à mão: `ImageConvertAdapter`
 * é parametrizado, então adicionar um par de imagem ao catálogo já o registra aqui. Evita a
 * classe de bug em que o par aparece na UI como `live` mas o registry não resolve nenhum adapter.
 */
function imageAdapters(): readonly FileConverterPort[] {
  return CONVERSION_PAIRS.flatMap((pair) => {
    if (pair.category !== "images") return [];
    // Os guards narrowam `AcceptedExtension` para `ImageExtension` sem cast. Um par da categoria
    // `images` com extensão que não é de imagem é inconsistência de catálogo: ignorado aqui e
    // pego pelo teste de consistência catálogo↔registry.
    if (!isImageExtension(pair.from) || !isImageExtension(pair.to)) return [];
    return [new ImageConvertAdapter(pair.from, pair.to)];
  });
}

/**
 * Monta o registry de conversores server-side. Vive fora do `container.ts` de propósito: o
 * container importa `server-only` e o Firebase Admin, o que impediria testar o registry
 * isoladamente. Aqui só entram adapters puros.
 */
export function buildConverterRegistry(): ConverterRegistry {
  return new ConverterRegistry([
    new CsvToXlsxAdapter(),
    new XlsxToCsvAdapter(),
    new CsvToJsonAdapter(),
    new JsonToCsvAdapter(),
    new PdfToTxtAdapter(),
    new DocxToPdfAdapter(),
    new XlsxToJsonAdapter(),
    new MarkdownToPdfAdapter(),
    ...imageAdapters(),
  ]);
}
