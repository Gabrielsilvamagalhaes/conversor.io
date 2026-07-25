# Decisão — Storage Temporário e TTL

Registro de decisão de arquitetura do [[Projeto Com Hans]]. Refere-se ao item
**"Storage temporário + TTL"**, adiado da Fase 1 para a Fase 3 do [[Roadmap]].

- **Data:** 2026-07-19 · **Atualizado:** 2026-07-25
- **Status:** Decidido · metadados (`ConversionJob` + Firestore) **entregues na Fase 2**;
  storage de arquivo + TTL seguem **adiados para a Fase 3**
- **Contexto:** [[Contexto Conversão de Arquivos]] · [[Ambientes e Deploy]] · [[Processamento de Arquivos]]
  · [[Decisão - Observabilidade e Logs Estruturados]]

## Estado atual (2026-07-25)

O app continua **stateless e síncrono** no fluxo de conversão: o `POST /api/convert`
recebe os bytes, converte via `FileConverterPort` e devolve os bytes convertidos na
**mesma request**. Nada toca disco. A UI já não baixa o resultado automaticamente — mostra
uma prévia e o download vira ação explícita — mas isso não muda o backend: o blob ainda
vem todo na resposta de `convert`, não há rota de download separada nem storage.

O que **mudou** desde a versão anterior deste ADR: a Fase 2 implementou o histórico de
conversões (agregado `ConversionJob`, port `ConversionJobRepositoryPort`, adapter
`FirestoreConversionJobRepository` — ver [[Contexto Conversão de Arquivos]]). O agregado
já existe e já é persistido no Firestore, mas **só com metadados** — nenhum arquivo é
armazenado. Os campos `storageKey` e `expiresAt` já existem no `ConversionJobSnapshot` e
são sempre `null`, reservados propositalmente para quando o storage de arquivo entrar.
Não existe ainda `FileStoragePort` nem `src/infrastructure/storage/`.

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
3. Preenche `storageKey` e `expiresAt = createdAt + TTL` no `ConversionJob` já persistido
   pelo `RecordConversionUseCase` (Fase 2) — os campos já existem no agregado, hoje sempre
   `null`; passam a ser preenchidos, sem alterar o schema.
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

### Peças — o que já existe (Fase 2) vs. o que falta (Fase 3)

| Camada | Peça | Status |
| --- | --- | --- |
| Domain | `ConversionJob` (com `storageKey`/`expiresAt` sempre `null`) | ✅ Fase 2 |
| Domain | `ConversionJobRepositoryPort` | ✅ Fase 2 |
| Infrastructure | `FirestoreConversionJobRepository` | ✅ Fase 2 |
| Domain | `FileStoragePort` (`save`/`load`/`delete`/`url`) | 📅 Fase 3 |
| Infrastructure | Adapter de bucket (`FirebaseStorageAdapter` ou Vercel Blob) | 📅 Fase 3 |
| Presentation | `GET /api/download/{jobId}` | 📅 Fase 3 |
| Config | `TEMP_FILE_TTL_MS` derivado de `TEMP_FILE_TTL_MINUTES`, bucket em `di/env.ts` | 📅 Fase 3 |

## Por que adiar até o Histórico de Conversões

O Histórico (Fase 2, [[Roadmap]]) precisava dos **mesmos** registros `ConversionJob` +
repository que o Storage+TTL usaria. Storage+TTL e Histórico **compartilham o agregado**.
Construir storage isolado antes do Histórico = meio-modelo (job sem histórico); construir
o Histórico primeiro, com o agregado já preparado para o storage (`storageKey`/`expiresAt`
presentes desde o início, sempre `null`) = um agregado coerente, entregue em duas fases,
**sem migração de dados** quando o storage chegar. Foi essa a escolha feita na Fase 2.

## Por que segue adiado para a Fase 3

O Histórico foi entregue; o storage de arquivo ainda não. Motivo: o objetivo da Fase 2 era
o histórico funcionar de forma independente do storage (metadados bastam para dashboard e
auditoria). Ligar `storageKey` a um bucket real, implementar `FileStoragePort`, a rota
`GET /api/download/{jobId}` e o lifecycle rule do bucket é escopo suficiente para uma fase
própria — e não bloqueia nada do que a Fase 2 entregou.

## Alternativas descartadas

- **Temp dir local (`os.tmpdir()`) + reaper** — quebra no Vercel (FS efêmero, sem
  processo longo). Só válido em self-host Docker/VM; fora do alvo.
- **Manter tudo em memória sem persistir** — é o estado atual; suficiente para docs
  pequenos (o limite ativo é `MAX_DOCUMENT_SIZE_MB`, hoje 4 MB por padrão — ver
  [[Ambientes e Deploy]]) enquanto não há re-download nem histórico de arquivo.
  Insuficiente quando entrar re-download por link. Vídeo→áudio **não** pressiona esse
  limite porque roda no navegador (ffmpeg.wasm) e nunca sobe o arquivo de vídeo ao
  servidor — ver [[Decisão - Conversão docx para pdf sem LibreOffice]] para o raciocínio
  equivalente de rodar conversão fora do servidor quando o ambiente serverless não comporta
  a ferramenta.
