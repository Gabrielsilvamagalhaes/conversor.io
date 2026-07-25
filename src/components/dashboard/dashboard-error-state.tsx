"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Estado de erro do painel (ex.: Firestore fora do ar). Mensagem honesta + ação de tentar
 * de novo — a página continua navegável mesmo com a busca de dados falha.
 */
export function DashboardErrorState() {
  const router = useRouter();

  return (
    <div role="alert" className="mt-8 rounded-2xl border border-line bg-bg-elev p-8 text-center">
      <p className="font-display text-xl">Não foi possível carregar o seu painel agora</p>
      <p className="mt-2 text-sm text-muted">
        O histórico de conversões está temporariamente indisponível. Tente novamente em instantes.
      </p>
      <Button type="button" variant="outline" className="mt-6" onClick={() => router.refresh()}>
        Tentar novamente
      </Button>
    </div>
  );
}
