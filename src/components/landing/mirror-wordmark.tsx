"use client";

import { motion, useReducedMotion } from "motion/react";

interface MirrorWordmarkProps {
  readonly children: string;
}

/**
 * Wordmark em escala editorial com um duplo espelhado atrás — o elemento-assinatura da home.
 *
 * Leonardo escrevia da direita para a esquerda, em espelho; nas páginas dos cadernos a tinta
 * atravessa o papel e o texto reaparece invertido no verso. É o artefato mais característico
 * do códice e, ao mesmo tempo, exatamente o que o produto faz: pegar algo ilegível no formato
 * errado e devolver legível. O duplo é estático e quase transparente (marca d'água, não efeito);
 * a única animação é o compasso de entrada — a palavra legível assenta primeiro, a tinta
 * espelhada aparece depois. Sob `prefers-reduced-motion`, os dois aparecem prontos.
 */
export function MirrorWordmark({ children }: MirrorWordmarkProps) {
  const reduceMotion = useReducedMotion();

  const ink = reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.8, delay: 0.5 },
      };
  const word = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="relative select-none">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 block -translate-y-1 translate-x-1 scale-x-[-1] font-display text-[clamp(2.75rem,11vw,8.5rem)] font-light leading-[0.85] tracking-tight text-sanguine/12"
        {...ink}
      >
        {children}
      </motion.span>
      <motion.span
        className="relative block font-display text-[clamp(2.75rem,11vw,8.5rem)] font-light leading-[0.85] tracking-tight text-fg"
        {...word}
      >
        {children}
      </motion.span>
    </div>
  );
}
