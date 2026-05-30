# Next.js 16

Decisões de frontend/backend com Next.js 16 no [[Projeto Com Hans]].

## Versão

- **Node.js 22** LTS (local, CI, Vercel e Docker)
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5.x** strict mode

## App Router

| Rota | Tipo | Função |
| --- | --- | --- |
| `/` | Server Component | Landing + conversor |
| `/convert` | Client Component | Upload, progresso, download |
| `/login` | Client | Firebase UI / custom |
| `/api/convert` | Route Handler | POST conversão |
| `/api/jobs/[id]` | Route Handler | GET status |
| `/api/auth/session` | Route Handler | Criar session cookie |
| `/api/auth/logout` | Route Handler | Revogar sessão |

## Server vs Client

- **Server Components:** layout, SEO, listagem estática de pares.
- **Client Components:** drag-and-drop upload, barra de progresso, auth SDK.
- **Route Handlers:** borda fina — delegam a use cases.

## Middleware

`src/middleware.ts`:

- Verifica session cookie em rotas protegidas (fase 2).
- Rate limiting básico por IP (opcional: `@upstash/ratelimit`).
- Matcher: `/history`, `/settings`, `/api/*` (exceto health).

## Configuração

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};
```

Ajustar limites conforme maior arquivo aceito (vídeos podem exigir upload direto para storage — fase 2).

## UI

Sugestão: **shadcn/ui** + Tailwind CSS 4 — alinhado ao ecossistema Next moderno.

## Estrutura

Ver [[Estrutura de Pastas]] — presentation isolada em `src/app/`.

## Deploy

- **Vercel** (recomendado para Next 16)
- Variáveis de ambiente — [[Ambientes e Deploy]]
- CI via [[GitHub Actions]]

## Limitações conhecidas

- Conversões pesadas (vídeo longo) podem exceder timeout serverless → evoluir para fila + worker (mês 3).
