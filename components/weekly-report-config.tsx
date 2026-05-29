'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Save, Loader2 } from 'lucide-react';
import { saveWeeklyReportConfig } from '@/app/actions/tickets';

interface Props {
  companyId: string;
  config: { enabled?: boolean; recipients?: string[] } | null;
}

export function WeeklyReportConfig({ config }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [recipients, setRecipients] = useState((config?.recipients ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData();
    if (enabled) form.set('enabled', 'on');
    form.set('recipients', recipients);

    try {
      const res = await fetch('/profile', {
        method: 'POST',
        body: form,
      });

      const url = new URL(res.url || '/profile', window.location.origin);
      const errParam = url.searchParams.get('error');
      if (errParam) {
        setError(decodeURIComponent(errParam));
        setSaving(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
        <BarChart3 className="h-3.5 w-3.5" />
        Reporte semanal
      </h2>
      <div className="rounded-xl border border-border bg-muted p-4">
        <p className="mb-3 text-xs leading-relaxed text-gray-500">
          Recibe un resumen semanal con estadísticas de tickets, rendimiento de agentes y consumo de tokens.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Reporte automático</span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-amber-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={enabled}
            >
              <span
                className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Correos destinatarios (uno por línea o separados por coma)
              </label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                rows={3}
                placeholder="admin@miempresa.com&#10;gerente@miempresa.com"
                className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
