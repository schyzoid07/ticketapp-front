'use client';

import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, MessageSquareText, Bot, User, Shield, Wrench } from 'lucide-react';
import type { Reply } from '@/lib/types';
import { sendReply } from '@/app/actions/tickets';

export function TicketReply({
  ticketId,
  userId,
  agentName,
  aiSuggestion,
  replies,
  ticketStatus,
}: {
  ticketId: string;
  userId: string;
  agentName: string;
  aiSuggestion: string | null;
  replies: Reply[];
  ticketStatus?: string;
}) {
  const [state, formAction, pending] = useActionState<{ error: string; success: boolean }, FormData>(sendReply, { error: '', success: false });

  return (
    <div className="space-y-6">
      {/* Replies */}
      {replies.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <MessageSquareText className="h-3.5 w-3.5" />
            Conversación
          </h3>
          <div className="space-y-3">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={`flex gap-3 ${reply.author_type === 'agent' ? 'justify-end' : ''}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    reply.author_type === 'agent'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'border border-border bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {reply.author_type === 'agent' ? (
                      <Shield className="h-3 w-3 opacity-70" />
                    ) : (
                      <User className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs font-medium ${reply.author_type === 'agent' ? 'text-white/80' : 'text-gray-500'}`}>
                      {reply.author_type === 'agent'
                        ? (reply.author_name || 'Agente')
                        : 'Cliente'}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${reply.author_type === 'agent' ? 'text-white/90' : 'text-gray-600'}`}>
                    {reply.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      {state.success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-6 text-center"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-foreground">Respuesta enviada</p>
          <p className="mt-1 text-xs text-gray-400">El ticket ha sido marcado como resuelto automáticamente</p>
        </motion.div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="ticket_id" value={ticketId} />
          <input type="hidden" name="author_name" value={agentName} />

          <div>
            <label htmlFor="body" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <MessageSquareText className="h-3.5 w-3.5" />
              Tu respuesta
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={4}
              className="mt-1.5 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              placeholder="Escribe tu respuesta al cliente..."
              defaultValue={aiSuggestion || ''}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-md disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {ticketStatus === 'OPEN' ? 'Tomar y resolver ticket' : 'Enviar respuesta y resolver ticket'}
          </button>
        </form>
      )}
    </div>
  );
}
