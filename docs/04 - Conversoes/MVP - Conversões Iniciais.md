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

**Total:** 9 pares de conversão na launch.

## UX mínima

1. Selecionar categoria (Planilha, Documento, Dados, Vídeo).
2. Escolher par origem → destino (somente pares habilitados).
3. Upload (drag-and-drop).
4. Barra de progresso + polling `/api/jobs/[id]`.
5. Botão download quando `completed`.

## Critérios de aceite

- [ ] Todos os 9 pares funcionam com arquivo de exemplo documentado
- [ ] Erro claro para formato não suportado
- [ ] Arquivo expira após 1h
- [ ] Conversão anônima funcional (rate limit básico)
- [ ] Login opcional via Firebase

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
