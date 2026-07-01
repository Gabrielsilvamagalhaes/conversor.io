"use client";

import Image from "next/image";
import Link from "next/link";
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
  const redirectTo = searchParams.get("redirect") ?? "/app";

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
    <main className="grid min-h-dvh md:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="font-display text-lg font-semibold">
            conversor<span className="text-sanguine">.io</span>
          </Link>
          <h1 className="mt-8 font-display text-3xl">
            {mode === "signin" ? "Entre no studiolo." : "Crie sua conta."}
          </h1>
          <p className="mt-2 text-sm text-muted">Sua oficina de transmutação de arquivos.</p>

          <button
            type="button"
            disabled={pending}
            onClick={() => void run(signInWithGoogle)}
            className="mt-8 w-full rounded-md border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-bg-elev disabled:opacity-50"
          >
            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              aria-label="E-mail"
              placeholder="mestre@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sanguine"
            />
            <input
              type="password"
              required
              minLength={6}
              aria-label="Senha"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sanguine"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Aguarde…" : mode === "signin" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          {error ? <p className="mt-4 text-center text-sm text-sanguine">{error}</p> : null}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-sm text-muted underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
          </button>
        </div>
      </div>

      <div className="relative hidden bg-bg-elev md:block">
        <Image
          src="/art/selfportrait.jpg"
          alt="Autorretrato de Leonardo da Vinci"
          fill
          sizes="50vw"
          className="object-cover object-top"
        />
        <p className="absolute bottom-4 right-4 text-right text-[0.65rem] leading-tight text-muted">
          <span className="font-display text-fg">Autorritratto</span>
          <br />
          Leonardo da Vinci · c. 1512
        </p>
      </div>
    </main>
  );
}
