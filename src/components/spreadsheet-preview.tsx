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
  const [headerRow, ...bodyRows] = rows;

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="truncate font-medium text-fg" title={fileName}>
          {fileName}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <span className="uppercase">{extension}</span>
          <span className="text-sanguine">→</span>
          <span className="uppercase">{target}</span>
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Tamanho" value={`${sizeMb} MB`} />
        <Stat label="Linhas" value={totalRows.toLocaleString("pt-BR")} />
        <Stat label="Colunas" value={String(columns)} />
      </dl>

      <p className="mt-5 mb-2 text-xs uppercase tracking-[0.18em] text-gold">
        Prévia · {Math.min(rows.length, 10)} de {totalRows.toLocaleString("pt-BR")} linhas
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
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
      </div>
    </div>
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
