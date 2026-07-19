interface FileInfoCardProps {
  readonly fileName: string;
  readonly extension: string;
  readonly target: string;
  readonly sizeMb: number;
}

/** Card de metadados para formatos sem prévia de tabela (json, pdf, docx). */
export function FileInfoCard({ fileName, extension, target, sizeMb }: FileInfoCardProps) {
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

      <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Tamanho</dt>
          <dd className="mt-1 font-display text-lg text-fg">{sizeMb} MB</dd>
        </div>
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted">Destino</dt>
          <dd className="mt-1 font-display text-lg text-fg uppercase">{target}</dd>
        </div>
      </dl>
    </div>
  );
}
