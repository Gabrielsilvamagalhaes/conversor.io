"use client";

import { motion, useReducedMotion } from "motion/react";

interface ConversionFlowProps {
  readonly from: string;
  readonly to: string;
  /**
   * Progresso real, 0–1 (conversão client/vídeo via ffmpeg). Quando ausente (conversão
   * de servidor, sem eventos de progresso), a barra roda a animação decorativa por tempo.
   */
  readonly progress?: number;
}

const STEPS = ["Enviando", "Transmutando", "Finalizando"] as const;

/** Fluxo animado exibido durante a conversão (upload → convert → finalize). */
export function ConversionFlow({ from, to, progress }: ConversionFlowProps) {
  const reduceMotion = useReducedMotion();
  const hasRealProgress = progress !== undefined;
  const pct = hasRealProgress ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : null;

  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center">
      <div className="flex items-center justify-center gap-4 font-display text-2xl">
        <span className="uppercase text-muted">{from}</span>
        <motion.span
          className="text-sanguine"
          animate={reduceMotion ? undefined : { x: [-4, 4, -4] }}
          transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          →
        </motion.span>
        <span className="uppercase text-gold">{to}</span>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <motion.span
              className="h-2.5 w-2.5 rounded-full bg-sanguine"
              animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25], scale: [1, 1.4, 1] }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.25,
                ease: "easeInOut",
              }}
            />
            <span className="text-xs text-muted">{step}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-line">
        {hasRealProgress ? (
          <motion.div
            className="h-full bg-gradient-to-r from-sanguine to-gold"
            animate={{ width: `${pct}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          />
        ) : (
          <motion.div
            className="h-full bg-gradient-to-r from-sanguine to-gold"
            initial={{ width: "0%" }}
            animate={reduceMotion ? { width: "100%" } : { width: ["0%", "70%", "92%"] }}
            transition={{ duration: 2.4, ease: "easeOut" }}
          />
        )}
      </div>

      {pct !== null ? <p className="mt-3 text-xs tabular-nums text-muted">{pct}%</p> : null}
    </div>
  );
}
