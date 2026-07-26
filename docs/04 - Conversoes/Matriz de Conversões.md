# Matriz de Conversões

Catálogo completo (atual + planejado) do [[Projeto Com Hans]].

## Legenda

| Símbolo | Significado |
| --- | --- |
| ✅ | Disponível |
| 🚧 | Em desenvolvimento |
| 📅 | Planejado |
| 🔮 | Futuro / IA |

## Documentos e dados

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| xlsx | csv | ✅ MVP | v0.1 |
| csv | xlsx | ✅ MVP | v0.1 |
| docx | pdf | ✅ MVP | v0.1 |
| pdf | txt | ✅ MVP | v0.1 |
| json | csv | ✅ MVP | v0.1 |
| csv | json | ✅ MVP | v0.1 |
| pptx | pdf | 📅 | v0.2 |
| odt | pdf | 📅 | v0.3 |
| md | pdf | ✅ | Fase 2 |
| pdf | docx | 📅 | v0.4 |
| xlsx | json | ✅ | Fase 2 |

## Mídia

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| mp4/webm/mov | mp3 | ✅ MVP | v0.1 |
| mp4/webm/mov | wav | ✅ MVP | v0.1 |
| mp4/webm/mov | texto (transcrição) | 🔮 | v1.0 |
| mp3 | txt (transcrição) | 🔮 | v1.0 |

## Imagens (fase 2+)

`.jpeg` é aceito como grafia alternativa de `.jpg` (mesmo container JPEG) — normalizado
para `jpg` antes de bater no catálogo (`EXTENSION_ALIASES`); não é um par adicional.

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| png | jpg | ✅ | Fase 2 |
| jpg | png | ✅ | Fase 2 |
| webp | png | ✅ | Fase 2 |
| webp | jpg | ✅ | Fase 2 |
| png | webp | ✅ | Fase 2 |
| jpg | webp | ✅ | Fase 2 |
| heic | jpg | 📅 | v0.2 |

## Arquivos compactados

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| zip | extrair | 📅 | v0.3 |
| múltiplos | zip | 📅 | v0.3 |

## Notas de implementação por par

- **`docx → pdf`** — sem LibreOffice: mammoth (docx→HTML) + mapper próprio
  (htmlparser2 → pdfmake). Layout reconstruído, não replicado (fontes/colunas/cabeçalho
  não são preservados). Ver [[Decisão - Conversão docx para pdf sem LibreOffice]].
- **`xlsx → json`** — streaming via ExcelJS, categoria `data`, engine `server`.
- **`pdf → docx`** — segue `📅` (`live: false` no catálogo); aparece na UI como "em breve".
- **`md → pdf`** — marked (Markdown → HTML) reaproveita o mesmo mapper `html-to-pdfmake.ts` e
  o singleton pdfmake (`pdfmake-instance.ts`) que já serviam `docx → pdf`. Ver
  [[Decisão - Conversão docx para pdf sem LibreOffice]].
- **Imagens** (`png↔jpg`, `webp→png`/`jpg`, `png`/`jpg`→`webp`) — sharp (decode → re-encode)
  atrás de um único adapter parametrizado (`ImageConvertAdapter`), instanciado 6× a partir do
  catálogo. Ver [[Decisão - Conversão de imagens com sharp]].

## Implementação

Cada linha ✅/📅 vira entrada no `ConversionCatalog` (`src/domain/conversion/value-objects/conversion-pair.ts`)
+ adapter em `src/infrastructure/conversion/converters/`.

Catálogo ✅ atual: 21 pares — 14 antes desta sprint (planilhas, dados, documentos, mídia) +
7 novos (`md → pdf` e os 6 pares de `images`).

Progressão detalhada: [[Progressão Mensal]].
