"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type {
  ConversionHistoryDto,
  ConversionJobDto,
} from "@/application/conversion/history/conversion-history.dto";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/shared/utils/format-bytes";
import { formatDuration } from "@/shared/utils/format-duration";

interface ConversionHistoryTableProps {
  readonly initialItems: readonly ConversionJobDto[];
  readonly initialCursor: string | null;
}

const PAGE_LIMIT = 20;
/** Chaves fixas (não índices) para as linhas de esqueleto exibidas durante "carregar mais". */
const SKELETON_ROW_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3"] as const;

/**
 * Classes comuns de célula: no desktop, célula de tabela normal; abaixo de 640px a linha vira
 * card empilhado e a célula vira um par rótulo/valor via `::before` + `content-[attr(...)]` —
 * transformação puramente CSS (o rótulo some do `data-label` do `<td>`), sem renderizar duas
 * árvores nem JS de media query.
 */
const CELL_BASE =
  "px-4 py-3 max-[639px]:flex max-[639px]:items-baseline max-[639px]:justify-between max-[639px]:gap-4 max-[639px]:px-0 max-[639px]:py-1.5 max-[639px]:before:content-[attr(data-label)] max-[639px]:before:shrink-0 max-[639px]:before:text-xs max-[639px]:before:font-medium max-[639px]:before:uppercase max-[639px]:before:tracking-wide max-[639px]:before:text-muted";

/** Histórico paginado do usuário — tabela semântica com fallback de cartões no mobile. */
export function ConversionHistoryTable({
  initialItems,
  initialCursor,
}: ConversionHistoryTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<readonly ConversionJobDto[]>(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/conversions?limit=${PAGE_LIMIT}&cursor=${encodeURIComponent(cursor)}`,
      );
      if (response.status === 401) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      if (!response.ok) throw new Error("Falha ao carregar mais conversões.");

      const page: ConversionHistoryDto = await response.json();
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      toast.error("Não foi possível carregar mais conversões. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full border-collapse text-sm max-[639px]:block">
        <caption className="sr-only">Histórico de conversões</caption>
        <thead className="max-[639px]:hidden">
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              Par
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Arquivo
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Tamanho
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Duração
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Quando
            </th>
          </tr>
        </thead>
        <tbody className="max-[639px]:block">
          {items.map((item, i) => (
            <tr
              key={item.id}
              className="border-b border-line last:border-0 even:bg-bg-elev hover:bg-bg-elev motion-safe:animate-in motion-safe:fade-in max-[639px]:mx-3 max-[639px]:mt-3 max-[639px]:block max-[639px]:rounded-xl max-[639px]:border max-[639px]:border-line max-[639px]:bg-bg-elev max-[639px]:p-3 max-[639px]:last:mb-3"
              style={
                i < 10
                  ? { animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }
                  : undefined
              }
            >
              <td data-label="Par" className={CELL_BASE}>
                <span className="font-mono text-xs uppercase tracking-wide text-fg">
                  {item.from} → {item.to}
                </span>
              </td>
              <td
                data-label="Arquivo"
                title={item.displayName}
                className={`${CELL_BASE} max-w-[16rem] max-[639px]:max-w-none`}
              >
                <span className="truncate">{item.displayName}</span>
              </td>
              <td data-label="Tamanho" className={`${CELL_BASE} tabular-nums text-muted`}>
                {formatBytes(item.sizeBytes)}
              </td>
              <td data-label="Duração" className={`${CELL_BASE} tabular-nums text-muted`}>
                {formatDuration(item.durationMs)}
              </td>
              <td data-label="Status" className={CELL_BASE}>
                <StatusPill status={item.status} errorCode={item.errorCode} />
              </td>
              <td data-label="Quando" className={`${CELL_BASE} text-muted`}>
                <RelativeTime iso={item.createdAt} />
              </td>
            </tr>
          ))}

          {loading
            ? SKELETON_ROW_KEYS.map((key) => (
                <tr key={key} className="border-b border-line last:border-0">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-line motion-reduce:animate-none" />
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>

      {cursor ? (
        <div className="flex justify-center border-t border-line p-4">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
