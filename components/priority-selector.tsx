'use client';

import { useState, useTransition } from 'react';
import { ArrowUpDown, Loader2, Check } from 'lucide-react';
import { setTicketPriority } from '@/app/actions/tickets';

const priorities = [
  { value: 1, label: 'Baja', color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  { value: 2, label: 'Media', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
  { value: 3, label: 'Alta', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
  { value: 4, label: 'Crítica', color: 'bg-red-50 text-red-600 hover:bg-red-100' },
];

export function PrioritySelector({ ticketId, currentPriority }: { ticketId: string; currentPriority: number | null }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentPriority);

  function handleChange(value: number) {
    setSelected(value);
    startTransition(async () => {
      await setTicketPriority(ticketId, value);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-400" />
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Prioridad</span>
      <div className="flex gap-1">
        {priorities.map((p) => (
          <button
            key={p.value}
            onClick={() => handleChange(p.value)}
            disabled={pending}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
              selected === p.value
                ? `${p.color} ring-2 ring-indigo-400/40`
                : `text-gray-400 hover:text-gray-600`
            }`}
          >
            {pending && selected === p.value ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : selected === p.value ? (
              <Check className="h-3 w-3" />
            ) : null}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
