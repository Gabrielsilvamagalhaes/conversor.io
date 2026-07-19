"use client";

import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type RootKind = "array" | "object" | "primitive";

const ROOT_KIND_LABEL: Record<RootKind, string> = {
  array: "Array",
  object: "Objeto",
  primitive: "Primitivo",
};

interface JsonPreviewProps {
  readonly fileName: string;
  readonly target: string;
  readonly sizeMb: number;
  readonly rootKind: RootKind;
  readonly itemCount: number | null;
  readonly depth: number;
  readonly sample: string;
  readonly truncated: boolean;
}

/** Card de metadados (tipo raiz, itens, profundidade) + amostra formatada do JSON. */
export function JsonPreview({
  fileName,
  target,
  sizeMb,
  rootKind,
  itemCount,
  depth,
  sample,
  truncated,
}: JsonPreviewProps) {
  const itemsLabel = rootKind === "array" ? "Itens" : "Chaves";
  const itemsValue = itemCount === null ? "—" : itemCount.toLocaleString("pt-BR");

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="truncate font-medium text-fg" title={fileName}>
          {fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="uppercase">json</span>
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
            <DialogContent className="max-w-3xl">
              <DialogTitle className="pr-8" title={fileName}>
                {fileName}
              </DialogTitle>
              <p className="mt-1 mb-4 text-muted text-xs uppercase tracking-[0.18em]">
                {ROOT_KIND_LABEL[rootKind]} · {itemsLabel.toLowerCase()}: {itemsValue} ·
                profundidade {depth}
              </p>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-bg">
                <CodeSample sample={sample} truncated={truncated} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Tamanho" value={`${sizeMb} MB`} />
        <Stat label="Tipo raiz" value={ROOT_KIND_LABEL[rootKind]} />
        <Stat label={itemsLabel} value={itemsValue} />
        <Stat label="Profundidade" value={String(depth)} />
      </dl>

      <p className="mt-5 mb-2 text-xs uppercase tracking-[0.18em] text-gold">
        Prévia{truncated ? " · amostra truncada" : ""}
      </p>
      <div className="max-h-72 overflow-auto rounded-lg border border-line bg-bg">
        <CodeSample sample={sample} truncated={truncated} />
      </div>
    </div>
  );
}

/** Amostra JSON indentada em bloco monoespaçado; sinaliza truncamento com reticências. */
function CodeSample({ sample, truncated }: { sample: string; truncated: boolean }) {
  return (
    <pre className="overflow-x-auto p-4 text-left font-mono text-xs leading-relaxed text-muted">
      <code>
        {sample}
        {truncated ? "\n…" : ""}
      </code>
    </pre>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 truncate font-display text-lg text-fg" title={value}>
        {value}
      </dd>
    </div>
  );
}
