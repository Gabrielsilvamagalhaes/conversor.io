# Ambientes e Deploy

Configuração de ambientes do [[Projeto Com Hans]].

## Ambientes

| Ambiente | Branch / trigger | URL |
| --- | --- | --- |
| **Local** | dev | `http://localhost:3000` |
| **Preview** | PR | `*.vercel.app` |
| **Production** | tag `v*` / main | `https://conversor.io` |

## Variáveis (.env.example)

> Espelha `.env.example` na raiz do repo. **Fonte de verdade é o arquivo**, não esta doc —
> conferido em 2026-07-25.

```bash
# App
NODE_ENV=development
APP_URL=http://localhost:3000          # prod: https://conversor.io

# Firebase Client (públicas, expostas no browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only — NUNCA expor)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Conversão
# Documentos/dados: opcional, default 4 MB — abaixo do teto de ~4.5 MB do body de função
# serverless da Vercel. Subir só em self-host/Vercel Pro.
MAX_DOCUMENT_SIZE_MB=4
# Vídeo é convertido no navegador (ffmpeg.wasm), nunca sobe ao servidor; os limites abaixo
# são constantes no código (`src/shared/constants/upload.ts`), não lidas do ambiente —
# ficam aqui só como documentação alinhada ao valor real.
MAX_VIDEO_SIZE_MB=100
MAX_VIDEO_DURATION_MIN=15
# Fase seguinte (storage/TTL — ainda não implementado, ver ADR de Storage Temporário e TTL):
TEMP_FILE_TTL_MINUTES=60

# Feature flags
ENABLE_VIDEO_CONVERSION=true
ENABLE_TRANSCRIPTION=false

# Observabilidade
# Reservado: o ConsoleJsonLogger atual emite todos os níveis sem filtro; LOG_LEVEL entra em
# vigor quando o filtro por nível for implementado.
LOG_LEVEL=info
# Adição futura (fora da Fase 2) — rastreamento de erros via Sentry.
# SENTRY_DSN=

# Histórico (Firestore)
# Usa o mesmo Firestore do projeto Firebase acima (credenciais FIREBASE_* já declaradas em
# "Firebase Admin"). Nenhuma env nova é necessária.
```

Não existe mais `STORAGE_PROVIDER`/`FIREBASE_STORAGE_BUCKET` — eram aspiracionais de uma
versão anterior desta doc; storage de arquivo ainda não foi implementado (Fase 3, ver
[[Decisão - Storage Temporário e TTL]]) e essas variáveis entram junto com ele.

## Firebase setup

1. Criar projeto no [Firebase Console](https://console.firebase.google.com).
2. Ativar Authentication (Google + email).
3. Gerar service account → JSON → extrair para env vars.
4. (Opcional) Storage bucket com lifecycle delete 1 day.

## Vercel

1. Import repo GitHub.
2. Framework preset: Next.js.
3. Node 22.
4. Env vars por ambiente (Preview vs Production).

Vídeo → áudio roda no navegador via ffmpeg.wasm — não precisa de ffmpeg instalado na
função serverless, worker externo nem Docker runtime. O plano anterior (item 5 desta
lista) ficou obsoleto quando a conversão de mídia migrou para o cliente.

## Node.js

Versão fixada em **22** em todos os ambientes:

| Onde | Como |
| --- | --- |
| Local | `.nvmrc` → `nvm use` / `fnm use` |
| CI | `node-version: 22` — [[GitHub Actions]] |
| Vercel | Project Settings → Node.js **22.x** |
| Docker | `FROM node:22-bookworm` |

Arquivo `.nvmrc` na raiz:

```
22
```

## Local dev

```bash
nvm use          # ou: fnm use
pnpm install
cp .env.example .env.local
pnpm dev
```

**Pré-requisitos locais para conversões completas:**
- Node.js **22**

Nenhum binário externo é necessário. Vídeo → áudio roda com ffmpeg.wasm no navegador
(`@ffmpeg/ffmpeg`, `postinstall` copia o core) — não usa `ffmpeg` do sistema. `docx → pdf`
usa mammoth + pdfmake em JS puro — não usa LibreOffice/`soffice`. Nenhum dos dois binários
está no PATH de nenhum ambiente deste projeto (dev, CI ou Vercel) — ver
[[Decisão - Conversão docx para pdf sem LibreOffice]].

## Docker (alternativa self-host)

```yaml
# docker-compose.yml (dev)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./tmp:/tmp/conversions
    environment:
      - STORAGE_PROVIDER=local
```

## Monitoramento

**Entregue na Fase 2:** log estruturado — uma linha JSON por evento em `process.stdout`
via `LoggerPort`/`ConsoleJsonLogger` (`src/infrastructure/observability/`), **sem pino**
(descartado por atrito de bundling em serverless — ver
[[Decisão - Observabilidade e Logs Estruturados]]). A Vercel já captura stdout; um log
drain (Axiom, Datadog etc.) pode ser plugado depois sem tocar em código.

**Ainda futuro:**
- Sentry para agrupamento/alerta de exceções (`SENTRY_DSN` já reservado em `.env.example`)
- Vercel Analytics

## CI

Pipeline completo: [[GitHub Actions]].
