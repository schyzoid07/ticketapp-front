'use client';

import { useActionState } from 'react';
import { Loader2, Send, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createTicket } from '@/app/actions/tickets';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

type TicketFormState = { error: string; ticket: TicketData | null };
const initialState: TicketFormState = { error: '', ticket: null };

export function TicketForm({ companyId, userId, userName }: { companyId: string; userId: string; userName: string }) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(createTicket, initialState);

  if (state.ticket) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <p className="text-lg font-semibold text-gray-900">Ticket recibido</p>
        <p className="mt-1 text-xs text-gray-400 tabular-nums">ID {state.ticket.id.slice(0, 8)}...</p>
        <a
          href={`/tickets/${state.ticket.id}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-md"
        >
          Ver ticket
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="user_name" value={userName} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1.5 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Ej: No puedo acceder al panel..."
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          className="mt-1.5 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          placeholder="Describe tu problema con detalle..."
        />
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar ticket
          </>
        )}
      </button>
    </form>
  );
}
