"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logout } from "@/infrastructure/auth/browser-auth";

/** Botão de sair — chama `logout()` (existente, nunca antes ligada a UI nenhuma). */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}
