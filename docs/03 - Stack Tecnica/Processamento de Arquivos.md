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

> Decisão detalhada em [[Decisão - Storage Temporário e TTL]]. **Não implementado**
> — hoje a conversão é síncrona/em memória; implementação adiada até o Histórico
> de Conversões (Fase 2), que compartilha o mesmo agregado `ConversionJob`.

Prod roda em **Vercel serverless** (FS efêmero por invocação), então `os.tmpdir()`
não persiste entre requests: exige **object storage externo** (Firebase Storage ou
Vercel Blob), não disco local.

TTL padrão: **1 hora**, em duas camadas — lifecycle rule do bucket (limpeza real,
sem cron) + checagem on-read (`now > expiresAt` → `410 Gone`).

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
