"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  readonly src: string;
  readonly alt: string;
  readonly sizes?: string;
  readonly priority?: boolean;
  readonly className?: string;
  /** Deslocamento máximo, em pixels, que a arte percorre ao seguir o cursor (default 10 — sutil). */
  readonly intensity?: number;
  /** Overlay/legenda sobreposto à imagem; o posicionamento absoluto é responsabilidade do consumidor. */
  readonly children?: ReactNode;
}

/**
 * Arte com parallax sutil: a imagem se desloca alguns pixels seguindo o cursor
 * dentro do container (levemente ampliada para não expor borda vazia). Sob
 * `prefers-reduced-motion` ou ponteiro grosso (touch), renderiza uma `<Image>`
 * estática, sem wrapper de motion e sem nenhum listener de mouse.
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  priority,
  className,
  intensity = 10,
  children,
}: ParallaxImageProps) {
  const reduceMotion = useReducedMotion();
  const [coarsePointer, setCoarsePointer] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const disabled = reduceMotion || coarsePointer;

  if (disabled) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
        {children}
      </div>
    );
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ratioY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(ratioX * intensity);
    y.set(ratioY * intensity);
  }

  function handleMouseLeave(): void {
    x.set(0);
    y.set(0);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: rastreia o cursor para o parallax, não é um controle interativo
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div className="absolute inset-0" style={{ x: springX, y: springY }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="scale-105 object-cover"
        />
      </motion.div>
      {children}
    </div>
  );
}
