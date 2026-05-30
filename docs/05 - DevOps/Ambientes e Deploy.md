# Ambientes e Deploy

Configuração de ambientes do [[Projeto Com Hans]].

## Ambientes

| Ambiente | Branch / trigger | URL |
| --- | --- | --- |
| **Local** | dev | `http://localhost:3000` |
| **Preview** | PR | `*.vercel.app` |
| **Production** | tag `v*` / main | `https://conversor.io` |

## Variáveis (.env.example)

```bash
# App
NODE_ENV=development
APP_URL=http://localhost:3000          # prod: https://conversor.io

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Storage (prod)
STORAGE_PROVIDER=local          # local | firebase | r2
FIREBASE_STORAGE_BUCKET=

# Conversion limits
MAX_DOCUMENT_SIZE_MB=10
MAX_VIDEO_SIZE_MB=100
MAX_VIDEO_DURATION_MIN=15
TEMP_FILE_TTL_MINUTES=60

# Feature flags
ENABLE_VIDEO_CONVERSION=true
ENABLE_TRANSCRIPTION=false
```

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
5. Instalar ffmpeg: usar **Docker runtime** ou external worker para vídeo — Vercel serverless tem limite; planejar worker no mês 2 ([[Progressão Mensal]]).

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
- ffmpeg no PATH
- LibreOffice (`soffice`) no PATH

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

## Monitoramento (fase 2)

- Vercel Analytics
- Sentry para erros
- Log estruturado (pino) nos adapters

## CI

Pipeline completo: [[GitHub Actions]].
