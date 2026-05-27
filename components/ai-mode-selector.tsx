'use client';

import { useState, useTransition } from 'react';
import { Zap, BrainCircuit, Loader2 } from 'lucide-react';
import { setTicketAIMode } from '@/app/actions/tickets';

interface Props {
  ticketId: string;
  currentMode: 'minimal' | 'complete';
}

export function AIModeSelector({ ticketId, currentMode }: Props) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(currentMode);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const newMode = mode === 'minimal' ? 'complete' : 'minimal';
    setMode(newMode);
    setError(null);
    startTransition(async () => {
      const result = await setTicketAIMode(ticketId, newMode);
      if (result.error) {
        setError(result.error);
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
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
