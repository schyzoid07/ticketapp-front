'use client';

import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, ArrowRight, AlertCircle, CheckCircle2, Mail, User } from 'lucide-react';
import type { TicketFormState } from '@/lib/types';
import { createTicket } from '@/app/actions/tickets';
const initialState: TicketFormState = { error: '', ticket: null };

export function PublicTicketForm({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(createTicket, initialState);

  if (state.ticket) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 className="h-8 w-8 text-white" />
        </motion.div>
        <p className="text-lg font-semibold text-foreground">Ticket recibido</p>
        <p className="mt-1 text-sm text-gray-500">Te responderemos pronto a tu correo</p>
        <p className="mt-1 text-xs text-gray-400 tabular-nums">ID {state.ticket.id.slice(0, 8)}...</p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="company_id" value={companyId} />

      <div>
        <label htmlFor="user_name" className="block text-sm font-medium text-foreground/70">
          Nombre completo
        </label>
        <div className="relative mt-1.5">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="user_name"
            name="user_name"
            required
            className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Tu nombre"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground/70">
          Correo electrónico
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            id="email"
            name="email"
            required
            className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground/70">
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
        <label htmlFor="description" className="block text-sm font-medium text-foreground/70">
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

      {state.rateLimit && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-100 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">Límite de solicitudes alcanzado</p>
            <p className="mt-0.5 text-sm text-red-600">{state.error}</p>
            <p className="mt-1 text-xs text-red-500">Has enviado demasiados tickets. Espera {state.rateLimit.resetMinutes} minutos antes de intentar de nuevo.</p>
          </div>
        </motion.div>
      )}

      {state.error && !state.rateLimit && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{state.error}</p>
        </motion.div>
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
