# Decisão — Observabilidade e Logs Estruturados

Registro de decisão de arquitetura do [[Projeto Com Hans]]. Refere-se ao item
**"Observabilidade (logs estruturados, métricas)"** da Fase 2 do [[Roadmap]].

- **Data:** 2026-07-25
- **Status:** Decidido e implementado (logs) · métricas/rastreamento de erros **adiados**
- **Contexto:** [[Contexto Conversão de Arquivos]] · [[Ambientes e Deploy]] ·
  [[Decisão - Storage Temporário e TTL]]

## Contexto

Antes da Fase 2 o app tinha **zero observabilidade**: nenhuma linha de log estruturado,
nenhum `requestId` correlacionando uma requisição através das camadas, e pior — vários
`catch {}` silenciosos (`firebase-auth.adapter.ts`, `get-session.use-case.ts`, o fallback
500 de `error-response.ts`) que **engoliam a causa raiz** de um erro antes que ele chegasse
a qualquer lugar visível. Em produção na Vercel, isso significa: uma conversão falha, o
usuário vê uma mensagem genérica, e não existe rastro nenhum de por quê.

## Decisão

Introduzir um port `LoggerPort` (`src/domain/observability/ports/logger.port.ts`) e uma
implementação `ConsoleJsonLogger` (`src/infrastructure/observability/`) que escreve **uma
linha JSON por evento em `process.stdout`**. Nenhuma dependência nova: a Vercel já captura
stdout e permite configurar um log drain (Axiom, Datadog, etc.) depois, sem tocar em código.

### Formato do evento

Campos do `LogEvent`: `timestamp` (ISO-8601 UTC), `level` (`info`/`warn`/`error`),
`service` (`api-gateway` · `conversion-service` · `identity-service` · `history-service` —
bounded context lógico, não processo físico), `event` (snake_case, ex.
`conversion_started`), `requestId`, `userId`, `clientIp`, `durationMs`, `status`,
`attempt`, `context` (livre) e `error`.

`child(bindings)` deriva um logger com campos fixos herdados (`service`, `requestId`,
`userId`, `clientIp`) sem mutar a instância original — cada requisição ganha um logger
filho com esses campos já presos, em vez de repeti-los em toda chamada. O header
`x-request-id` é ecoado em toda resposta, inclusive nas de erro, para correlacionar
logs do servidor com o que o cliente reportar.

Em produção emite JSON puro; fora de produção emite uma linha legível de uma linha (sem
cores ANSI) — mesma informação, formato mais fácil de ler no terminal do `pnpm dev`.

### Regras de dado sensível

O ponto central deste ADR: **persistência ≠ telemetria**. O nome legível de um arquivo
(`displayName`) é dado do próprio usuário e é gravado no Firestore, protegido por dono
(ver [[Contexto Conversão de Arquivos]] e `firestore.rules`) — ali é razoável. Nos logs,
que saem para stdout/terceiros e não têm o mesmo controle de acesso, o mesmo nome **nunca**
aparece; vai `fileNameHash` (sha256 truncado a 12 hex), que é irreversível e ainda serve
para correlacionar duas linhas de log sobre o mesmo arquivo.

Implementado em `src/infrastructure/observability/redact.ts`:

- **Allowlist no topo** — só os campos definidos em `LogEvent` chegam ao payload; nada
  passa "sem querer" por composição de objetos.
- **Denylist recursiva por substring** no `context` livre — chaves contendo `token`,
  `session`, `cookie`, `authorization`, `password`, `secret`, `email`, `cpf`, `filename`,
  `displayname` etc. são redigidas (`[redacted]`) em qualquer profundidade, com exceção
  explícita para chaves terminadas em `hash` (um hash é irreversível por construção —
  redigi-lo destruiria a única correlação possível sem custo de privacidade).
- **Erro sempre serializado**, nunca o objeto cru — evita vazar `config`/`request`/headers
  de libs como Firebase Admin. Vira `{ name, message, stack }`, com strings truncadas.
- **IP truncado** — IPv4 tem o último octeto zerado (`1.2.3.0`); IPv6 mantém só o
  prefixo /48.
- Strings longas são truncadas (500 chars), objetos com profundidade/número de chaves
  excessivos viram `[truncated]`, ciclos viram `[circular]`.

### `catch {}` corrigidos

Três blocos que descartavam silenciosamente a exceção original passaram a logar via
`LoggerPort`: `firebase-auth.adapter.ts`, `get-session.use-case.ts`, e o fallback 500 de
`error-response.ts` (`toErrorResponse`) — que agora loga o erro não mapeado antes de
devolver a mensagem genérica ao cliente.

## Alternativas descartadas

- **pino** — logger estruturado padrão de mercado no Node, mas é uma dependência nova com
  atrito de bundling conhecido em runtimes serverless/edge do Next (workers de transporte,
  `thread-stream`) — exatamente o tipo de armadilha de bundler que já mordeu este projeto em
  [[Decisão - Conversão docx para pdf sem LibreOffice]]. `console.log`/`process.stdout.write`
  com JSON manual entrega o mesmo resultado (linha estruturada, capturável pela Vercel) sem
  esse risco e sem dependência nova.
- **Sentry** (`@sentry/nextjs`) — agrupamento de exceções, alertas, breadcrumbs. Ficou
  **fora desta fase conscientemente**: é dependência nova + conta externa, e os logs
  estruturados em stdout já dão visibilidade suficiente para o estágio atual do produto.
  Ver "Próximo passo" abaixo.
- **Vercel Analytics / métricas de produto** — mesma lógica: adiado, não é observabilidade
  de erro/operação e não estava bloqueando nada nesta fase.

## Próximo passo

**Sentry** é o próximo passo natural para observabilidade, fora do escopo desta fase:
agrupamento de exceções por assinatura, alerta ativo (em vez de precisar ler stdout) e
source maps para stack traces legíveis em produção. `SENTRY_DSN` já está reservado
(comentado) em `.env.example`.
