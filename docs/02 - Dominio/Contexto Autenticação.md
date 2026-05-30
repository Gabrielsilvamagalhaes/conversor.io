# Contexto Autenticação

Bounded context de **Identidade** do [[Projeto Com Hans]].

## Escopo

Firebase Authentication como provedor de identidade. O domínio **não** replica usuários — apenas modela sessão e permissões derivadas.

## Agregado: AuthenticatedUser

```
AuthenticatedUser
├── uid: UserId
├── email?: Email
├── displayName?: string
├── emailVerified: boolean
└── provider: 'google' | 'email' | 'github' | ...
```

## Comportamento no MVP

| Cenário | Comportamento |
| --- | --- |
| Visitante anônimo | Pode converter com rate limit por IP |
| Usuário logado | Mesmas conversões; histórico na fase 2 |
| Token inválido | 401; redirect login em rotas protegidas |

## Port: AuthSessionPort

```typescript
interface AuthSessionPort {
  verifySession(request: Request): Promise<AuthenticatedUser | null>;
  createSessionCookie(idToken: string): Promise<string>;
  revokeSession(sessionCookie: string): Promise<void>;
}
```

Implementação: [[Firebase Auth]] → `FirebaseAuthAdapter`.

## Middleware Next.js

1. Lê cookie `__session` (Firebase session cookie).
2. Chama `GetSessionUseCase`.
3. Injeta `user` no request context (headers internos ou `AsyncLocalStorage`).

## Rotas protegidas (fase 2+)

- `/history` — conversões do usuário
- `/settings` — preferências
- API keys (fase 3)

## Quotas (futuro)

```
QuotaPolicy
├── anonymousDailyLimit: number
├── authenticatedDailyLimit: number
└── maxVideoDurationMinutes: number
```

Validação no `ConvertFileUseCase` consultando `QuotaPort`.

## Segurança

- Session cookies `httpOnly`, `secure`, `sameSite=lax`
- Refresh gerenciado pelo SDK Firebase client + route `/api/auth/session`
- Nunca expor `FIREBASE_PRIVATE_KEY` no client
