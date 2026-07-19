# Roadmap

Cronograma macro alinhado à [[Progressão Mensal]] e à visão em [[Visão do Produto]].

## Fase 0 — Fundação (Semanas 1–2)

- [x] Repositório Git + [[Conventional Commits]]
- [x] Scaffold Next.js 16 conforme [[Estrutura de Pastas]]
- [x] Firebase Auth + middleware de sessão — [[Firebase Auth]]
- [x] Pipeline [[GitHub Actions]] (lint, typecheck, build)
- [x] UI: upload, seleção de conversão, download

## Fase 1 — MVP (Semanas 3–6)

- [ ] Conversões documentais e dados — [[MVP - Conversões Iniciais]]
- [ ] Vídeo → áudio (ffmpeg)
- [ ] Storage temporário + TTL
- [ ] Tratamento de erros e limites de tamanho



## Fase 2 — Consolidação (Mês 2)

- [ ] Histórico de conversões (usuário logado)
- [ ] Novos pares do mês 2 na [[Progressão Mensal]]
- [ ] Observabilidade (logs estruturados, métricas)



## Fase 3 — Escala (Mês 3+)

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


