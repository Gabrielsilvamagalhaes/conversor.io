# Decisão — Storage Temporário e TTL

Registro de decisão de arquitetura do [[Projeto Com Hans]]. Refere-se ao item
**"Storage temporário + TTL"** da Fase 1 do [[Roadmap]].

- **Data:** 2026-07-19
- **Status:** Decidido · **implementação adiada** até o Histórico de Conversões (Fase 2)
- **Contexto:** [[Contexto Conversão de Arquivos]] · [[Ambientes e Deploy]] · [[Processamento de Arquivos]]

## Estado atual

O app é **stateless, síncrono e 100% em memória**: o `POST /api/convert` recebe os
bytes, converte via `FileConverterPort` e devolve os bytes convertidos na **mesma
request**. Nada toca disco. Não existe storage port, agregado `ConversionJob` nem
`src/infrastructure/storage/`. As menções a storage/TTL no restante de `/docs` são
**aspiracionais**, não implementadas.

## Restrição decisiva — Vercel serverless

Produção roda em **Vercel serverless** ([[Ambientes e Deploy]]). O filesystem é
**efêmero por invocação**:

- Arquivo escrito na request de `convert` **não existe** numa request separada de
  `download` — invocações não compartilham disco.
- Não há processo longo-vivo para rodar um reaper/cron de limpeza.

**Consequência:** `os.tmpdir()` + cleanup cron (abordagem descrita na doc antiga)
**não funciona** em prod no Vercel. Só serviria num runtime self-hosted longo-vivo
(Docker/VM), que não é o alvo atual. Portanto: **object storage externo obrigatório**.

## Decisão

Quando implementado, storage temporário + TTL usará **object storage externo** +
registro persistido, sem tocar o FS local do Vercel.

### Fluxo futuro

1. `convert` converte em memória (como hoje).
2. Faz upload do output para um **bucket** (**Firebase Storage** — já usamos Firebase —
   ou Vercel Blob), sob chave `conversions/{userId}/{jobId}.{ext}`.
3. Persiste um registro `ConversionJob` (Firestore): `id, userId, fileName, from/to,
   sizeBytes, status, createdAt, expiresAt = createdAt + TTL, storageKey`.
4. Devolve `jobId` + rota `GET /api/download/{jobId}` que valida dono + expiração e
   faz **stream** do bucket.

### TTL em duas camadas

- **Lifecycle rule do bucket** apaga objetos mais velhos que o TTL automaticamente —
  a limpeza real do disco, **sem cron**.
- **Checagem on-read** na rota de download: se `now > expiresAt`, retorna `410 Gone`
  mesmo que o objeto ainda exista.
- (Opcional) Vercel Cron varrendo registros órfãos no Firestore — dispensável dado o
  lifecycle rule.

TTL padrão: **1 hora** (`TEMP_FILE_TTL_MINUTES=60` já previsto em [[Ambientes e Deploy]]).

### Peças novas (Clean Architecture)

| Camada | Peça |
| --- | --- |
| Domain | `FileStoragePort` (`save`/`load`/`delete`/`url`), agregado `ConversionJob` (lifecycle + `expiresAt`), `ConversionJobRepositoryPort` |
| Infrastructure | `FirebaseStorageAdapter`, `FirestoreJobRepository` |
| Config | `TEMP_FILE_TTL_MS` em `shared/constants`, bucket em `di/env.ts` |

## Por que adiar até o Histórico de Conversões

O Histórico (Fase 2, [[Roadmap]]) precisa dos **mesmos** registros `ConversionJob` +
repository. Storage+TTL e Histórico **compartilham o agregado**. Construir storage
isolado agora = meio-modelo (job sem histórico); construir junto = um agregado
coerente, uma migração de dados. Logo, a implementação espera o Histórico.

## Alternativas descartadas

- **Temp dir local (`os.tmpdir()`) + reaper** — quebra no Vercel (FS efêmero, sem
  processo longo). Só válido em self-host Docker/VM; fora do alvo.
- **Manter tudo em memória sem persistir** — é o estado atual; suficiente para docs
  pequenos (≤10 MB) enquanto não há re-download nem histórico. Insuficiente quando
  entrar vídeo→áudio (ffmpeg trabalha em arquivos) ou re-download por link.
