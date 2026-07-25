# Projeto Com Hans — hub

**conversor.io** — site conversor de arquivos full-stack com **Clean Architecture**, **DDD**, **Next.js 16**, **TypeScript** e **Firebase Auth**.

> Documentação do projeto em `/docs` (cópia espelhada do vault Obsidian **Projeto Com Hans**).

## Visão rápida

| Item | Decisão |
| --- | --- |
| Nome / domínio | **conversor.io** |
| Repositório Git | `conversor-io` |
| Stack | Next.js 16 + TypeScript + **Node.js 22** |
| Auth / sessão | Firebase Authentication |
| Arquitetura | Clean Architecture + DDD |
| Commits | Conventional Commits |
| CI/CD | GitHub Actions |
| MVP | 5 formatos de documento + vídeo → áudio |

## Mapa da documentação

### Visão e planejamento
- [[Visão do Produto]]
- [[Glossário]]
- [[Roadmap]]

### Arquitetura
- [[Clean Architecture + DDD]]
- [[Camadas e Dependências]]
- [[Bounded Contexts]]
- [[Estrutura de Pastas]]
- [[Decisão - Storage Temporário e TTL]]
- [[Decisão - Observabilidade e Logs Estruturados]]
- [[Decisão - Conversão docx para pdf sem LibreOffice]]

### Domínio
- [[Contexto Conversão de Arquivos]]
- [[Contexto Autenticação]]
- [[Entidades e Value Objects]]
- [[Casos de Uso (MVP)]]

### Stack técnica
- [[Next.js 16]]
- [[Firebase Auth]]
- [[Convenções TypeScript]]
- [[Processamento de Arquivos]]

### Conversões
- [[Matriz de Conversões]]
- [[MVP - Conversões Iniciais]]
- [[Progressão Mensal]]

### DevOps
- [[Conventional Commits]]
- [[GitHub Actions]]
- [[Ambientes e Deploy]]

### Futuro
- [[Transcrição de Vídeo com IA]]

## Próximos passos

1. Validar escopo do MVP em [[MVP - Conversões Iniciais]].
2. Criar repositório Git e aplicar [[Estrutura de Pastas]].
3. Configurar Firebase e variáveis em [[Ambientes e Deploy]].
4. Implementar casos de uso de [[Casos de Uso (MVP)]].
5. Ativar pipeline de [[GitHub Actions]].
