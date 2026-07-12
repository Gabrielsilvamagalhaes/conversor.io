"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  readonly words: readonly string[];
  readonly className?: string;
}

/** Digita/apaga palavras em ciclo. Com prefers-reduced-motion, mostra só a primeira. */
export function Typewriter({ words, className }: TypewriterProps) {
  const [text, setText] = useState(words[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let word = 0;
    let char = words[0]?.length ?? 0;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = words[word] ?? "";
      setText(current.slice(0, char));
      if (!deleting && char < current.length) {
        char++;
        timer = setTimeout(tick, 72);
      } else if (!deleting) {
        deleting = true;
        timer = setTimeout(tick, 1900);
      } else if (deleting && char > 0) {
        char--;
        timer = setTimeout(tick, 34);
      } else {
        deleting = false;
        word = (word + 1) % words.length;
        timer = setTimeout(tick, 300);
      }
    };

    timer = setTimeout(tick, 1900);
    return () => clearTimeout(timer);
  }, [words]);

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block w-0.5 animate-pulse bg-sanguine align-baseline">
        &nbsp;
      </span>
    </span>
  );
}
