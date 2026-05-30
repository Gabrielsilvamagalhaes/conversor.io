# Progressão Mensal

Cadência de novas conversões do [[Projeto Com Hans]] — uma release funcional por mês após o MVP.

## Modelo de release

Cada mês:
1. Adicionar **3–6 novos pares** ao `ConversionCatalog`.
2. Implementar adapters + testes de integração.
3. Atualizar UI (filtros/categorias se necessário).
4. Tag semver + changelog.
5. Atualizar [[Matriz de Conversões]].

---

## Mês 0 — MVP (v0.1.0)

**Foco:** fundação + conversões essenciais

| Novos pares |
| --- |
| xlsx ↔ csv |
| docx → pdf, pdf → txt |
| json ↔ csv |
| vídeo → mp3/wav |

Ver [[MVP - Conversões Iniciais]].

---

## Mês 1 (v0.2.0)

**Foco:** escritório + imagens básicas

| Novos pares | Ferramenta |
| --- | --- |
| pptx → pdf | LibreOffice |
| txt → pdf | puppeteer / libreoffice |
| xlsx → json | SheetJS |
| png ↔ jpg | sharp |
| webp → png | sharp |

**Melhorias:** seletor de sheet no xlsx; preview de PDF inline.

---

## Mês 2 (v0.3.0)

**Foco:** produtividade + compactação

| Novos pares | Ferramenta |
| --- | --- |
| odt → pdf | LibreOffice |
| md → pdf | md-to-pdf |
| heic → jpg | sharp + heic-convert |
| zip → extrair arquivos | adm-zip |
| múltiplos arquivos → zip | archiver |

**Melhorias:** fila assíncrona para jobs > 30s; worker separado.

---

## Mês 3 (v0.4.0)

**Foco:** PDF avançado + áudio

| Novos pares | Ferramenta |
| --- | --- |
| pdf → docx | pdf2docx (qualidade limitada) |
| pdf escaneado → txt | Tesseract OCR |
| mp3 → wav / wav → mp3 | ffmpeg |
| epub → pdf | calibre CLI |

**Melhorias:** histórico de conversões (usuário logado + Firestore).

---

## Mês 4 (v0.5.0)

**Foco:** preparação IA

| Novos pares | Ferramenta |
| --- | --- |
| srt → txt | nativo |
| vtt → srt | nativo |
| áudio → texto (stub) | Whisper API (beta interno) |

**Melhorias:** feature flag `TRANSCRIPTION_BETA`.

---

## Mês 5+ (v1.0.0)

**Foco:** [[Transcrição de Vídeo com IA]]

| Capability |
| --- |
| Vídeo → transcrição com timestamps |
| Export srt / vtt / txt |
| Resumo opcional com LLM |

---

## Checklist mensal (template)

```markdown
## Release v0.X.0 — Mês N

- [ ] Pares definidos e revisados
- [ ] Adapters implementados
- [ ] Testes integração (fixtures)
- [ ] Limites de tamanho documentados
- [ ] Matriz de conversões atualizada
- [ ] Changelog + tag git
- [ ] Deploy produção
```

## Priorização

Em caso de atraso, priorizar pares com **maior demanda** (analytics) sobre quantidade bruta.
