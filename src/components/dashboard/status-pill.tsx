import { cn } from "@/lib/utils";
import { humanizeErrorCode } from "@/shared/utils/humanize-error-code";

interface StatusPillProps {
  readonly status: string;
  readonly errorCode: string | null;
}

/**
 * Selo de status sempre com texto (nunca só cor) — `--sanguine` para falha, tom neutro para
 * sucesso. Em falha, o `errorCode` bruto vira uma frase legível no `title`, nunca na tela.
 */
export function StatusPill({ status, errorCode }: StatusPillProps) {
  const isFailed = status === "failed";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        isFailed
          ? "border-sanguine/40 bg-sanguine/10 text-sanguine"
          : "border-line bg-transparent text-muted",
      )}
      title={isFailed ? humanizeErrorCode(errorCode) : undefined}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", isFailed ? "bg-sanguine" : "bg-muted")}
      />
      {isFailed ? "Falhou" : "Concluído"}
    </span>
  );
}
