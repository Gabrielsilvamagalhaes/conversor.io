# Visão do Produto

**Produto:** **conversor.io**  
**Status:** Planejamento  
**Projeto:** [[Projeto Com Hans]]

## Problema

Usuários precisam converter arquivos entre formatos comuns (planilhas, documentos, PDFs, dados estruturados) e extrair áudio de vídeos — sem instalar software pesado ou pagar por ferramentas fragmentadas.

## Proposta de valor

Um site rápido, confiável e extensível que:

1. Aceita upload de arquivos suportados.
2. Executa conversão no servidor (ou pipeline assíncrono quando necessário).
3. Entrega download do resultado com feedback de progresso.
4. Mantém histórico básico para usuários autenticados (fase posterior ao MVP).

## Público-alvo

- Profissionais de escritório (Excel, Word, PDF).
- Desenvolvedores e analistas de dados (CSV, JSON).
- Criadores de conteúdo (vídeo → áudio).

## Escopo MVP (v0.1)

| Categoria | Formatos |
| --- | --- |
| Planilhas | `.xlsx` ↔ `.csv` |
| Documentos | `.docx` → `.pdf`, `.pdf` → `.txt` |
| Dados | `.json` ↔ `.csv` |
| Mídia | Vídeo (`.mp4`, `.webm`, `.mov`) → `.mp3` / `.wav` |

## Fora do MVP (planejado)

- Transcrição de vídeo com IA — ver [[Transcrição de Vídeo com IA]]
- Conversões em lote
- API pública
- Limites por plano / monetização

## Princípios de produto

1. **Conversão previsível** — matriz clara do que entra e o que sai.
2. **Progressão mensal** — novos pares de conversão a cada release — ver [[Progressão Mensal]].
3. **Privacidade** — arquivos temporários; TTL curto; sem retenção desnecessária.
4. **Extensibilidade** — cada conversor é um adaptador plugável no domínio.

## Métricas de sucesso (MVP)

- Taxa de conversão concluída > 95%
- Tempo médio de conversão documental < 10s (arquivos até 5 MB)
- Zero vazamento de arquivos após TTL configurado
