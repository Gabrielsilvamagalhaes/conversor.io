# MVP - Conversões Iniciais

Escopo fechado da v0.1 do [[Projeto Com Hans]].

## Formatos base (solicitados)

| Formato | Papel no MVP |
| --- | --- |
| **.xlsx** | Planilha Excel → CSV |
| **.csv** | Dados tabulares ↔ XLSX e JSON |
| **.pdf** | Documento → texto extraído |
| **.docx** | Word → PDF |
| **.json** | Dados estruturados ↔ CSV *(5º formato comum)* |

> **Por que JSON?** Par natural com CSV, muito usado em APIs, configs e ETL — complementa xlsx/csv sem overlap.

## Conversões incluídas na v0.1

### Planilhas
- `xlsx` → `csv`
- `csv` → `xlsx`

### Documentos
- `docx` → `pdf`
- `pdf` → `txt` (extração, sem OCR)

### Dados
- `json` → `csv`
- `csv` → `json`

### Mídia
- `mp4` / `webm` / `mov` → `mp3`
- `mp4` / `webm` / `mov` → `wav`

**Total:** 9 pares de conversão na launch. Todos os 9 estão `live` — inclusive
`docx → pdf`, que rodava com adapter ainda não implementado no início do MVP e passou a
`live: true` na Fase 2 (mammoth + pdfmake, sem LibreOffice — ver
[[Decisão - Conversão docx para pdf sem LibreOffice]]).

## Adendo (Fase 2) — além do escopo original

Fora dos 5 formatos base acima, a Fase 2 também entregou `xlsx → json` (categoria Dados,
streaming via ExcelJS) — não fazia parte do MVP fechado, mas coube junto por reaproveitar
o mesmo leitor de planilha do par `xlsx → csv`. Ver [[Matriz de Conversões]].

## UX mínima

1. Selecionar categoria (Planilha, Documento, Dados, Vídeo).
2. Escolher par origem → destino (somente pares habilitados).
3. Upload (drag-and-drop).
4. Barra de progresso + polling `/api/jobs/[id]`.
5. Botão download quando `completed`.

## Critérios de aceite

- [x] Todos os 9 pares funcionam com arquivo de exemplo documentado (fixtures em
      `src/infrastructure/conversion/converters/__fixtures__/` + testes de round-trip)
- [x] Erro claro para formato não suportado — `mapDomainError` central, mensagens pt-BR
- [ ] Arquivo expira após 1h — TTL segue não implementado, adiado para a Fase 3 (ver
      [[Decisão - Storage Temporário e TTL]])
- [ ] Conversão anônima funcional (rate limit básico) — **revertido na Fase 2**: `/api/upload`,
      `/api/preview` e `/api/convert` agora exigem sessão (`requireSession()`). Antes eram
      públicas por descuido — o gate de login era só de navegação, não da API — e isso foi
      fechado como correção de segurança. Efeito colateral: o critério original de MVP
      ("conversão anônima") deixou de valer; hoje é preciso estar logado para converter.
- [ ] Login opcional via Firebase — login via Firebase existe e funciona, mas deixou de ser
      **opcional**: pelo motivo acima, hoje é exigido para converter

## Arquivos de teste

Manter em `tests/fixtures/` (não commitar dados sensíveis):

```
tests/fixtures/sample.xlsx
tests/fixtures/sample.csv
tests/fixtures/sample.pdf
tests/fixtures/sample.docx
tests/fixtures/sample.json
tests/fixtures/sample.mp4
```

## Fora do MVP

- Transcrição IA — [[Transcrição de Vídeo com IA]]
- OCR em PDF escaneado
- Batch / fila assíncrona longa

Próximos formatos: [[Progressão Mensal]] mês 2.
