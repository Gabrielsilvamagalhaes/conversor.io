"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MagneticProps {
  readonly children: ReactNode;
  /** Fração do deslocamento do cursor aplicada ao elemento (default 0.25). */
  readonly strength?: number;
  readonly className?: string;
}

/**
 * Atrai levemente o elemento em direção ao cursor enquanto o mouse se move sobre
 * ele (offset relativo ao centro do bounding rect, suavizado por uma mola sóbria).
 * Desativado sob `prefers-reduced-motion` e em telas de ponteiro grosso (touch) —
 * nesses casos o filho é renderizado sem nenhum listener de mouse.
 */
export function Magnetic({ children, strength = 0.25, className }: MagneticProps) {
  const reduceMotion = useReducedMotion();
  const [coarsePointer, setCoarsePointer] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const disabled = reduceMotion || coarsePointer;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * strength);
    y.set(offsetY * strength);
  }

  function handleMouseLeave(): void {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
