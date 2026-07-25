# Roadmap

Cronograma macro alinhado à [[Progressão Mensal]] e à visão em [[Visão do Produto]].

## Fase 0 — Fundação (Semanas 1–2)

- [x] Repositório Git + [[Conventional Commits]]
- [x] Scaffold Next.js 16 conforme [[Estrutura de Pastas]]
- [x] Firebase Auth + middleware de sessão — [[Firebase Auth]]
- [x] Pipeline [[GitHub Actions]] (lint, typecheck, build)
- [x] UI: upload, seleção de conversão, download

## Fase 1 — MVP (Semanas 3–6)

- [x] Conversões documentais e dados — [[MVP - Conversões Iniciais]] (os 6 pares
      documentais/dados do MVP estão `live`; `docx → pdf` roda sem LibreOffice — ver
      [[Decisão - Conversão docx para pdf sem LibreOffice]])
- [x] Vídeo → áudio (ffmpeg) — roda no **navegador** via ffmpeg.wasm (`engine: "client"`
      no catálogo), não no servidor como o item sugeria originalmente
- [ ] Storage temporário + TTL — adiado para a Fase 3, agora sem exigir migração porque
      `storageKey`/`expiresAt` já existem no agregado `ConversionJob` — ver
      [[Decisão - Storage Temporário e TTL]]
- [x] Tratamento de erros e limites de tamanho — `ValidateUploadUseCase` (tamanho, magic
      bytes, allowlist de extensão) + `mapDomainError` central



## Fase 2 — Consolidação (Mês 2)

- [x] Histórico de conversões (usuário logado) — agregado `ConversionJob` + Firestore,
      só metadados (nenhum arquivo é armazenado) — ver [[Contexto Conversão de Arquivos]]
- [ ] Novos pares do mês 2 na [[Progressão Mensal]] — parcial: só `xlsx → json` entrou;
      pptx/imagens/odt continuam pendentes
- [x] Logs estruturados — `LoggerPort` + `ConsoleJsonLogger` (JSON em stdout) — ver
      [[Decisão - Observabilidade e Logs Estruturados]]
- [ ] Métricas / rastreamento de erros (Vercel Analytics, Sentry) — adiado, fora desta fase
- [x] Segurança do Firestore — `firestore.rules` nega todo acesso client-side (todo acesso
      passa pelo Admin SDK no servidor); falta o usuário publicar as regras em produção
- [x] Autenticação obrigatória nas APIs de conversão — `/api/upload`, `/api/preview` e
      `/api/convert` exigiam sessão só por gate de navegação; agora exigem `requireSession()`
      também na API (buraco fechado — não estava no roadmap original)
- [x] Dashboard (`/dashboard`) — estatísticas, sparkline de 14 dias, histórico paginado
      (não estava no roadmap original)
- [x] Prévia do resultado antes do download — `/api/convert` continua devolvendo o blob,
      mas o download deixou de ser automático (não estava no roadmap original)



## Fase 3 — Escala (Mês 3+)

- [ ] Storage temporário + TTL (adiado da Fase 1 — ver [[Decisão - Storage Temporário e TTL]])
- [ ] Fila de jobs para conversões pesadas
- [ ] Conversões em lote
- [ ] Novos pares mensais contínuos



## Fase 4 — IA (futuro)

- [ ] [[Transcrição de Vídeo com IA]]
- [ ] Resumo automático de transcrições



## Releases sugeridas


| Versão | Foco  | Conversões novas                         |
| ------ | ----- | ---------------------------------------- |
| v0.1.0 | MVP   | xlsx, csv, pdf, docx, json + vídeo→áudio |
| v0.2.0 | Mês 2 | pptx, txt, imagens                       |
| v0.3.0 | Mês 3 | compressão, odt, markdown                |
| v0.4.0 | Mês 4 | áudio→texto (stub IA)                    |
| v1.0.0 | IA    | transcrição completa de vídeo            |


