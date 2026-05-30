# Estrutura de Pastas

Layout do monorepo / app Next.js 16 para o [[Projeto Com Hans]].

## Raiz do repositório

```
conversor-io/                       # repo Git (produto: conversor.io)
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-preview.yml
├── .husky/
│   └── commit-msg                  # commitlint
├── commitlint.config.js
├── .nvmrc                           # 22
├── next.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── .env.example
├── README.md
│
├── public/
│   └── ...
│
└── src/
    ├── app/                        # Presentation (Next.js App Router)
    ├── domain/
    ├── application/
    ├── infrastructure/
    ├── di/
    └── shared/
```

## `src/app/` — Presentation

```
src/app/
├── (public)/
│   ├── page.tsx                    # landing + conversor
│   ├── convert/
│   │   └── page.tsx
│   └── layout.tsx
├── (auth)/
│   ├── login/
│   └── layout.tsx
├── api/
│   ├── convert/
│   │   └── route.ts                # POST upload + par
│   ├── jobs/
│   │   └── [id]/
│   │       └── route.ts            # GET status / download
│   └── health/
│       └── route.ts
├── middleware.ts                   # Firebase session cookie
├── layout.tsx
└── globals.css
```

## `src/domain/` — Domain

```
src/domain/
├── conversion/
│   ├── entities/
│   │   └── conversion-job.ts
│   ├── value-objects/
│   │   ├── conversion-pair.ts
│   │   ├── file-format.ts
│   │   └── job-status.ts
│   ├── errors/
│   │   └── conversion-errors.ts
│   └── ports/
│       ├── conversion-job-repository.port.ts
│       ├── file-storage.port.ts
│       └── file-converter.port.ts
├── identity/
│   ├── entities/
│   │   └── authenticated-user.ts
│   └── ports/
│       └── auth-session.port.ts
└── catalog/
    └── conversion-catalog.ts       # pares habilitados por release
```

## `src/application/` — Application

```
src/application/
├── conversion/
│   ├── convert-file.use-case.ts
│   ├── get-job-status.use-case.ts
│   ├── list-supported-pairs.use-case.ts
│   └── dto/
│       └── conversion-job.dto.ts
├── identity/
│   └── get-session.use-case.ts
└── services/
    └── converter-registry.ts
```

## `src/infrastructure/` — Infrastructure

```
src/infrastructure/
├── auth/
│   └── firebase-auth.adapter.ts
├── storage/
│   ├── local-temp-storage.adapter.ts   # dev
│   └── firebase-storage.adapter.ts       # prod (opcional)
├── persistence/
│   └── in-memory-job.repository.ts     # MVP → Firestore depois
├── converters/
│   ├── documents/
│   │   ├── xlsx-to-csv.adapter.ts
│   │   ├── csv-to-xlsx.adapter.ts
│   │   ├── docx-to-pdf.adapter.ts
│   │   ├── pdf-to-text.adapter.ts
│   │   └── json-csv.adapter.ts
│   └── media/
│       └── ffmpeg-video-to-audio.adapter.ts
└── ffmpeg/
    └── ffmpeg-runner.ts
```

## `src/di/`

```
src/di/
├── container.ts
└── env.ts
```

## `src/shared/`

```
src/shared/
├── types/
├── utils/
└── constants/
    └── max-file-size.ts
```

## Scripts npm sugeridos

```json
{
  "name": "conversor-io",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "prepare": "husky"
  }
}
```

## Convenções de import

Use path aliases no `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/domain/*": ["./src/domain/*"],
      "@/application/*": ["./src/application/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

**Proibido:** `@/infrastructure` importado de `@/domain`.
