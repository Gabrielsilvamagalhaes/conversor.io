# Glossário

Termos do domínio e da arquitetura do [[Projeto Com Hans]] (**conversor.io**).

| Termo | Definição |
| --- | --- |
| **conversor.io** | Nome do produto e domínio público do site conversor de arquivos. |
| **Node.js 22** | Versão de runtime do projeto (local, CI, Vercel e Docker). |
| **Conversão** | Transformação de um arquivo de formato origem para formato destino, preservando conteúdo útil dentro dos limites do par suportado. |
| **Par de conversão** | Tupla `(origem, destino)` registrada no catálogo — ex.: `(xlsx, csv)`. |
| **Job de conversão** | Unidade de trabalho assíncrona quando a conversão excede timeout HTTP (ex.: vídeo longo). |
| **Adaptador de conversão** | Implementação na camada de infraestrutura que executa a transformação técnica (LibreOffice, ffmpeg, etc.). |
| **Bounded Context** | Fronteira DDD onde um modelo de domínio é coerente — ex.: `Conversão`, `Identidade`. |
| **Use Case** | Orquestração na camada de aplicação; não contém detalhes de biblioteca. |
| **Port** | Interface definida no domínio/aplicação; **Adapter** implementa na infra. |
| **TTL** | Tempo de vida do arquivo em storage temporário antes da exclusão. |
| **MVP** | Primeira versão publicável com subset de conversões — ver [[MVP - Conversões Iniciais]]. |
| **Progressão mensal** | Cadência de novos pares de conversão — ver [[Progressão Mensal]]. |

## Siglas

- **DDD** — Domain-Driven Design
- **CA** — Clean Architecture
- **CI/CD** — Integração e entrega contínua
