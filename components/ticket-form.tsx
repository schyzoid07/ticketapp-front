'use client';

import { useActionState } from 'react';
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
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-medium text-green-800">Ticket creado exitosamente</p>
        <p className="mt-1 text-sm text-green-600">ID: {state.ticket.id}</p>
        <a
          href={`/tickets/${state.ticket.id}`}
          className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Ver ticket
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="user_name" value={userName} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título del problema
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: No puedo acceder al panel de administración"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción detallada
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe tu problema con el mayor detalle posible..."
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Enviando...' : 'Crear ticket'}
      </button>
    </form>
  );
}
