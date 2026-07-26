"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  readonly children: ReactNode;
  /** Atraso da animação em segundos — útil para stagger manual (ex.: `delay={i * 0.08}`). */
  readonly delay?: number;
  readonly className?: string;
  /** Elemento HTML de saída. Default: `"div"`. */
  readonly as?: "div" | "section" | "li";
}

const MOTION_TAG = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
} as const;

/**
 * Revela o conteúdo ao entrar na viewport: fade-in com leve deslocamento vertical,
 * disparado uma única vez (`viewport.once`). Sob `prefers-reduced-motion`, renderiza
 * o elemento estático (sem `motion`, sem opacidade inicial zero, sem transform) —
 * o conteúdo aparece pronto, sem espera nem animação alguma.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = MOTION_TAG[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
