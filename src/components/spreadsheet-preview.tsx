"use client";

import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { COMPACT_PREVIEW_ROWS } from "@/shared/constants/upload";

interface SpreadsheetPreviewProps {
  readonly fileName: string;
  readonly extension: "csv" | "xlsx";
  readonly target: "csv" | "xlsx";
  readonly sizeMb: number;
  readonly totalRows: number;
  readonly columns: number;
  readonly rows: readonly (readonly string[])[];
}

/** Card de metadados (tamanho, linhas) + tabela das primeiras linhas da planilha. */
export function SpreadsheetPreview({
  fileName,
  extension,
  target,
  sizeMb,
  totalRows,
  columns,
  rows,
}: SpreadsheetPreviewProps) {
  const compactRows = rows.slice(0, COMPACT_PREVIEW_ROWS);

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="truncate font-medium text-fg" title={fileName}>
          {fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="uppercase">{extension}</span>
            <span className="text-sanguine">→</span>
            <span className="uppercase">{target}</span>
          </span>
          <Dialog>
            <DialogTrigger
              aria-label="Expandir prévia"
              className="rounded-md border border-line p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-sanguine"
            >
              <Maximize2 className="size-4" />
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogTitle className="pr-8" title={fileName}>
                {fileName}
              </DialogTitle>
              <p className="mt-1 mb-4 text-muted text-xs uppercase tracking-[0.18em]">
                {rows.length} de {totalRows.toLocaleString("pt-BR")} linhas · {columns} colunas
              </p>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line">
                <PreviewTable rows={rows} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Tamanho" value={`${sizeMb} MB`} />
        <Stat label="Linhas" value={totalRows.toLocaleString("pt-BR")} />
        <Stat label="Colunas" value={String(columns)} />
      </dl>

      <p className="mt-5 mb-2 text-xs uppercase tracking-[0.18em] text-gold">
        Prévia · {compactRows.length} de {totalRows.toLocaleString("pt-BR")} linhas
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <PreviewTable rows={compactRows} />
      </div>
    </div>
  );
}

/** Tabela posicional: 1ª linha vira cabeçalho. Reutilizada no card e no modal. */
function PreviewTable({ rows }: { rows: readonly (readonly string[])[] }) {
  const [headerRow, ...bodyRows] = rows;

  return (
    <table className="w-full border-collapse text-left text-sm">
      {headerRow ? (
        <thead>
          <tr className="bg-bg">
            {headerRow.map((cell, i) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: preview cells are positional
                key={i}
                className="whitespace-nowrap border-b border-line px-3 py-2 font-medium text-fg"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {bodyRows.map((row, r) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: preview rows are positional
          <tr key={r} className="odd:bg-bg/40">
            {row.map((cell, c) => (
              <td
                // biome-ignore lint/suspicious/noArrayIndexKey: preview cells are positional
                key={c}
                className="whitespace-nowrap border-b border-line px-3 py-2 text-muted"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-display text-lg text-fg">{value}</dd>
    </div>
  );
}
