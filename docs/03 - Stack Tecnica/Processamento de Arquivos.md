# Processamento de Arquivos

Stack e adapters de conversão do [[Projeto Com Hans]].

## Princípio

Cada par de conversão = **um adapter** implementando `FileConverterPort`. Registrados no `ConverterRegistry`.

## Ferramentas por categoria

| Categoria | Ferramenta | Pares |
| --- | --- | --- |
| Planilhas | `SheetJS (xlsx)` ou `exceljs` | xlsx ↔ csv |
| Documentos | `LibreOffice` headless ou `docx-pdf` | docx → pdf |
| PDF | `pdf-parse`, `pdf-lib` | pdf → txt |
| Dados | nativo + `papaparse` | json ↔ csv |
| Vídeo → áudio | **ffmpeg** | mp4/webm/mov → mp3/wav |

## ffmpeg (vídeo → áudio)

```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3
```

Adapter: `FfmpegVideoToAudioAdapter`

- Validar codec de entrada
- Timeout configurável
- Limite de duração no MVP (ex.: 15 min)

## docx → pdf

Opções:

1. **LibreOffice** (`soffice --headless --convert-to pdf`) — mais fiel
2. **@lib/docx + puppeteer** — mais pesado

Recomendação MVP: LibreOffice em container Docker local / CI com binary instalado.

## xlsx ↔ csv

- Preservar encoding UTF-8 com BOM opcional para Excel BR
- Tratar múltiplas sheets: MVP usa primeira sheet; sheet selector na v0.2

## pdf → txt

- Extração de texto (não OCR no MVP)
- OCR (Tesseract) → [[Progressão Mensal]] mês 3+

## Storage temporário

| Ambiente | Implementação |
| --- | --- |
| Dev | `os.tmpdir()` + cleanup cron |
| Prod | Firebase Storage ou Cloudflare R2 |

TTL padrão: **1 hora** — job scheduler ou lifecycle rule.

## Limites MVP

| Tipo | Tamanho max |
| --- | --- |
| Documentos / dados | 10 MB |
| Vídeo | 100 MB / 15 min |

## Sanitização

- Validar magic bytes, não só extensão
- Rejeitar executáveis disfarçados
- Nomes de arquivo sanitizados (sem path traversal)

## Docker (dev/prod worker)

```dockerfile
FROM node:22-bookworm
RUN apt-get update && apt-get install -y ffmpeg libreoffice-writer-nogui
```

Ver [[MVP - Conversões Iniciais]] e [[Progressão Mensal]].
