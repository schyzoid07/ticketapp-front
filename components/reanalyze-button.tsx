'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { reprocessTicket } from '@/app/actions/tickets';

export function ReanalyzeButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReanalyze() {
    setLoading(true);
    setError(null);
    const result = await reprocessTicket(ticketId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleReanalyze}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
        title="Re-analizar con IA"
      >
        <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Analizando...' : 'Re-analizar'}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 text-right max-w-48">
          {error === 'No autenticado' ? 'Debe iniciar sesión' :
           error.includes('Failed to fetch') ? 'Error de conexión con el servidor de IA' :
           error.includes('fetch') ? 'Error de conexión' :
           error.length > 80 ? error.slice(0, 77) + '...' :
           error}
        </p>
      )}
    </div>
  );
}
