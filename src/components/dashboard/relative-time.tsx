"use client";

import { useEffect, useState } from "react";
import { formatAbsoluteDateTime, formatRelativeTime } from "@/shared/utils/relative-time";

interface RelativeTimeProps {
  readonly iso: string;
}

/**
 * `<time>` com rótulo relativo ("há 2 h") e `title` absoluto.
 *
 * Cuidado com hidratação: "agora" no servidor e no cliente nunca coincidem, então calcular
 * o relativo direto no render divergiria entre SSR e o primeiro paint do cliente. Por isso o
 * rótulo inicial (servidor **e** primeiro render do cliente) é sempre o absoluto — idêntico
 * dos dois lados — e só depois de montado, em `useEffect` (que não participa da hidratação),
 * trocamos para o relativo.
 */
export function RelativeTime({ iso }: RelativeTimeProps) {
  const absolute = formatAbsoluteDateTime(iso);
  const [label, setLabel] = useState(absolute);

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
  }, [iso]);

  return (
    <time dateTime={iso} title={absolute}>
      {label}
    </time>
  );
}
