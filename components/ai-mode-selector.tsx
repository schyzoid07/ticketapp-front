'use client';

import { useState, useTransition } from 'react';
import { Zap, BrainCircuit, Loader2, CreditCard, ShieldAlert, PhoneCall } from 'lucide-react';
import { setTicketAIMode } from '@/app/actions/tickets';

interface Props {
  ticketId: string;
  currentMode: 'minimal' | 'complete';
  userRole?: string;
}

export function AIModeSelector({ ticketId, currentMode, userRole }: Props) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(currentMode);
  const [error, setError] = useState<string | null>(null);
  const [planErrorType, setPlanErrorType] = useState<string | null>(null);

  function handleToggle() {
    const newMode = mode === 'minimal' ? 'complete' : 'minimal';
    setMode(newMode);
    setError(null);
    setPlanErrorType(null);
    startTransition(async () => {
      const result = await setTicketAIMode(ticketId, newMode);
      if (result.error) {
        if (result.error === 'plan_restricted_owner' || result.error === 'plan_restricted_admin') {
          setPlanErrorType(result.error);
        } else {
          setError(result.error);
        }
        setMode(mode);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Modo IA</span>
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            mode === 'complete' ? 'bg-amber-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={mode === 'complete'}
        >
          <span
            className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              mode === 'complete' ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {mode === 'complete' ? (
              <BrainCircuit className="h-3 w-3 text-amber-500" />
            ) : (
              <Zap className="h-3 w-3 text-gray-400" />
            )}
          </span>
        </button>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {pending ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {mode === 'complete' ? 'Procesando...' : 'Actualizando...'}
          </span>
        ) : mode === 'complete' ? (
          <span className="text-amber-600">Completo</span>
        ) : (
          <span className="text-gray-500">Minimal</span>
        )}
      </span>

      {planErrorType === 'plan_restricted_owner' && (
        <div className="mt-2 w-72 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Plan Basic</p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-700/80">
                Tu empresa tiene el plan Basic, que solo permite el modo Minimal de IA. Para activar el análisis completo, actualiza tu plan.
              </p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-gray-300 px-3 py-1.5 text-[10px] font-medium text-gray-500">
                  <CreditCard className="h-3 w-3" />
                  Ir a pricing
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/60 px-3 py-1.5 text-[10px] font-medium text-amber-600">
                  <PhoneCall className="h-3 w-3" />
                  Contáctanos
                </span>
              </div>
              <p className="mt-1.5 text-[9px] text-amber-500/60">Próximamente podrás gestionar tu plan desde aquí</p>
            </div>
          </div>
        </div>
      )}

      {planErrorType === 'plan_restricted_admin' && (
        <div className="mt-2 w-72 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Plan Basic</p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-700/80">
                Tu empresa tiene el plan Basic, que solo permite el modo Minimal de IA. Pídele al dueño de la empresa que actualice al plan Complete para activar esta funcionalidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
