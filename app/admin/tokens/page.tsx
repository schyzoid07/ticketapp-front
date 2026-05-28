import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getCompanyTokenUsage } from '@/app/actions/tickets';
import { TokenBarChart } from '@/components/token-bar-chart';
import { BarChart3, Zap, TicketCheck, TrendingDown, TrendingUp, ArrowLeft, Cpu, MessageSquare, Search } from 'lucide-react';
import type { TokenUsageAggregate } from '@/lib/types';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('es');
}

function TokenRow({ label, icon: Icon, data, color, max }: { label: string; icon: typeof Zap; data: TokenUsageAggregate; color: string; max?: number }) {
  const pct = (max && max > 0) ? Math.round((data.totalTokens / max) * 100).toString() : (data.totalTokens > 0 ? '100' : '0');
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-bold text-foreground">{formatNumber(data.totalTokens)}</p>
      </div>
      <div className="hidden text-right text-[11px] tabular-nums text-gray-400 sm:block">
        <div>Prompt: {formatNumber(data.promptTokens)}</div>
        <div>Output: {formatNumber(data.candidatesTokens)}</div>
      </div>
      <div className="w-20 text-right">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export default async function AdminTokensPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const currentRole = user.user_metadata?.role as string;
  const canView = currentRole === 'owner' || currentRole === 'admin';
  if (!canView) redirect('/dashboard');

  const companyId = user.user_metadata?.company_id as string;
  const { report, error } = await getCompanyTokenUsage(companyId);

  if (error || !report) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error al cargar estadísticas: {error || 'No hay datos'}
        </div>
      </div>
    );
  }

  const { currentMonth, previousMonthTotal, previousMonthTicketCount, dailyUsage, recentTickets } = report;

  const avgTokens = currentMonth.ticketCount > 0
    ? Math.round(currentMonth.total.totalTokens / currentMonth.ticketCount)
    : 0;

  const pctChange = previousMonthTotal > 0
    ? ((currentMonth.total.totalTokens - previousMonthTotal) / previousMonthTotal * 100).toFixed(1)
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </a>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Dashboard de Tokens</h1>
          <p className="text-xs text-gray-500">
            Consumo de Gemini del mes actual — {currentMonth.ticketCount} tickets procesados con IA
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <Zap className="h-3.5 w-3.5" />
            Tokens totales
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(currentMonth.total.totalTokens)}
          </p>
          {pctChange && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {Number(pctChange) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-emerald-500" />
              )}
              <span className={Number(pctChange) >= 0 ? 'text-red-500' : 'text-emerald-500'}>
                {pctChange}% vs mes anterior
              </span>
              <span className="text-gray-400">({formatNumber(previousMonthTotal)} prev.)</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <TicketCheck className="h-3.5 w-3.5" />
            Tickets con IA
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {currentMonth.ticketCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {previousMonthTicketCount} en el mes anterior
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <Cpu className="h-3.5 w-3.5" />
            Promedio por ticket
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(avgTokens)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {currentMonth.total.promptTokens > currentMonth.total.candidatesTokens ? 'Más prompt que output' : 'Más output que prompt'}
          </p>
        </div>
      </div>

      {/* Plan Limit */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Límite del plan — {report.planName}
          </h2>
          <span className="ml-auto text-xs tabular-nums text-amber-600 font-semibold">
            {formatNumber(currentMonth.total.totalTokens)} / {formatNumber(report.planLimit)} tokens
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              (currentMonth.total.totalTokens / report.planLimit) > 0.9
                ? 'bg-red-500'
                : (currentMonth.total.totalTokens / report.planLimit) > 0.7
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min((currentMonth.total.totalTokens / report.planLimit) * 100, 100)}%` }}
          />
        </div>
        {currentMonth.total.totalTokens >= report.planLimit && (
          <p className="mt-2 text-xs text-red-600 font-medium">
            Límite mensual alcanzado. Los próximos tickets no se procesarán con IA hasta el próximo mes.
          </p>
        )}
      </div>

      {/* Bar Chart */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Consumo diario
          </h2>
        </div>
        <TokenBarChart data={dailyUsage} />
      </div>

      {/* Breakdown */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Desglose por agente
          </h2>
        </div>
        <div className="space-y-2">
          <TokenRow label="Triage" icon={Zap} data={currentMonth.triage} color="bg-amber-500" max={currentMonth.total.totalTokens} />
          <TokenRow label="Contexto" icon={Search} data={currentMonth.context} color="bg-blue-500" max={currentMonth.total.totalTokens} />
          <TokenRow label="Respuesta" icon={MessageSquare} data={currentMonth.response} color="bg-emerald-500" max={currentMonth.total.totalTokens} />
          <div className="border-t border-border pt-2">
            <TokenRow label="Total" icon={Cpu} data={currentMonth.total} color="bg-orange-600" max={currentMonth.total.totalTokens} />
          </div>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <TicketCheck className="h-4 w-4 text-gray-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Últimos tickets procesados ({recentTickets.length})
          </h2>
        </div>
        {recentTickets.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No hay tickets procesados con IA este mes
          </p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-2 font-medium">Ticket</th>
                  <th className="px-6 py-2 font-medium">Fecha</th>
                  <th className="px-6 py-2 text-right font-medium">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="max-w-56 truncate px-6 py-2.5">
                      <a
                        href={`/tickets/${t.id}`}
                        className="font-medium text-foreground transition-colors hover:text-amber-600"
                      >
                        {t.title}
                      </a>
                    </td>
                    <td className="px-6 py-2.5 tabular-nums text-gray-500">
                      {new Date(t.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-2.5 text-right tabular-nums font-medium text-foreground">
                      {formatNumber(t.totalTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
