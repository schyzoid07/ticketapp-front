'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, Bug, ShieldAlert, Flame, Zap, Star, CheckCircle } from 'lucide-react';

const priorities = [
  { value: '', label: 'Todas' },
  { value: '4', label: 'Crítica' },
  { value: '3', label: 'Alta' },
  { value: '2', label: 'Media' },
  { value: '1', label: 'Baja' },
];

const statuses = [
  { value: '', label: 'Todos' },
  { value: 'PENDING_TRIAGE', label: 'Analizando' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
];

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPriority = searchParams.get('priority') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/dashboard');
  }

  const hasFilters = currentPriority || currentStatus || currentFrom || currentTo;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Filtros</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={currentPriority}
            onChange={(e) => applyFilter('priority', e.target.value)}
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-gray-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={currentStatus}
            onChange={(e) => applyFilter('status', e.target.value)}
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-gray-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={currentFrom}
            onChange={(e) => applyFilter('from', e.target.value)}
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-gray-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Desde"
          />

          <input
            type="date"
            value={currentTo}
            onChange={(e) => applyFilter('to', e.target.value)}
            className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-gray-600 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-border bg-surface/50 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
          <span className="font-medium text-gray-400">Leyenda:</span>
          <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Resuelto</span>
          <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-purple-600" /> Crítico</span>
          <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3 text-red-600" /> Alta</span>
          <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-600" /> Media</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-blue-600" /> Baja</span>
        </div>
      </div>
    </div>
  );
}
