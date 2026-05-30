# GitHub Actions

Pipelines CI/CD do [[Projeto Com Hans]].

## Runtime

- **Node.js 22** em todos os jobs (`actions/setup-node@v4` → `node-version: 22`)
- Alinhado com `.nvmrc`, `engines` no `package.json` e Vercel — ver [[Ambientes e Deploy]]

## Workflows

```
.github/workflows/
├── ci.yml                 # PR + push main
├── deploy-preview.yml     # preview Vercel (opcional)
└── deploy-production.yml  # tag release → prod
```

## ci.yml (pull request + main)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test -- --run

  build:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}

  integration-ffmpeg:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:integration
```

## deploy-production.yml

Disparar em tag `v*`:

```yaml
name: Deploy Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Secrets necessários

| Secret | Uso |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Build client |
| `FIREBASE_PRIVATE_KEY` | Server (Vercel env) |
| `FIREBASE_CLIENT_EMAIL` | Server |
| `VERCEL_TOKEN` | Deploy |
| `VERCEL_ORG_ID` | Deploy |
| `VERCEL_PROJECT_ID` | Deploy |

## Branch protection (main)

- [ ] Require PR
- [ ] Require CI passing
- [ ] Require 1 review (quando equipe > 1)

## Release

1. Merge PR com [[Conventional Commits]].
2. `pnpm version patch|minor|major` ou tag manual.
3. GitHub Release notes automáticas (opcional: `release-please`).

Ver [[Ambientes e Deploy]].
