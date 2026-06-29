"use client";

import { useEffect, useState } from "react";

/** Alterna claro/escuro e persiste em localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      {dark ? "☾" : "☀"}
    </button>
  );
}
