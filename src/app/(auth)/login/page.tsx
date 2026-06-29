"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from "@/infrastructure/auth/browser-auth";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setError(null);
    setPending(true);
    try {
      await action();
      router.replace(redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao autenticar.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void run(() =>
      mode === "signin" ? signInWithEmail(email, password) : registerWithEmail(email, password),
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">conversor.io</h1>
        <p className="text-sm text-zinc-500">
          {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
        </p>
      </header>

      <button
        type="button"
        disabled={pending}
        onClick={() => void run(signInWithGoogle)}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        ou
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="email@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Aguarde…" : mode === "signin" ? "Entrar" : "Cadastrar"}
        </button>
      </form>

      {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-center text-sm text-zinc-500 underline-offset-4 hover:underline"
      >
        {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
      </button>
    </main>
  );
}
