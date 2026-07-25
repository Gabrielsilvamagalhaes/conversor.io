import { redirect } from "next/navigation";
import type {
  ConversionHistoryDto,
  ConversionStatsDto,
} from "@/application/conversion/history/conversion-history.dto";
import { ConversionHistoryTable } from "@/components/dashboard/conversion-history-table";
import { ConversionsSparkline } from "@/components/dashboard/conversions-sparkline";
import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { HistoryEmptyState } from "@/components/dashboard/history-empty-state";
import { StatsTiles } from "@/components/dashboard/stats-tiles";
import { SiteFooter } from "@/components/site-footer";
import { getContainer } from "@/di/container";
import { getServerSession } from "@/infrastructure/auth/server-session";

const PAGE_LIMIT = 20;

interface DashboardData {
  readonly history: ConversionHistoryDto;
  readonly stats: ConversionStatsDto;
}

/**
 * Busca a primeira página do histórico + estatísticas. Retorna `null` em caso de falha (ex.:
 * Firestore fora do ar) em vez de deixar a página inteira estourar — o painel mostra um
 * estado de erro renderizável e continua navegável.
 */
async function loadDashboardData(userId: string): Promise<DashboardData | null> {
  const container = getContainer();
  try {
    const [history, stats] = await Promise.all([
      container.listConversions.execute({ userId, limit: PAGE_LIMIT }),
      container.getConversionStats.execute({ userId }),
    ]);
    return { history, stats };
  } catch (error) {
    container.logger.error({
      event: "dashboard_data_load_failed",
      service: "history-service",
      userId,
      error,
    });
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/dashboard");

  const data = await loadDashboardData(user.uid);

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader user={user} />

      <main className="flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <span className="text-xs uppercase tracking-[0.22em] text-gold">Painel</span>
          <h1 className="mt-2 font-display text-3xl">Seu ateliê</h1>

          {data === null ? (
            <DashboardErrorState />
          ) : (
            <div className="mt-8 flex flex-col gap-8">
              <StatsTiles stats={data.stats} />
              <ConversionsSparkline byDay={data.stats.byDay} />
              {data.history.items.length === 0 ? (
                <HistoryEmptyState />
              ) : (
                <ConversionHistoryTable
                  initialItems={data.history.items}
                  initialCursor={data.history.nextCursor}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
