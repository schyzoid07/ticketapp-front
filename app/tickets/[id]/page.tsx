import { getTicket } from '@/app/actions/tickets';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Bug,
  CreditCard,
  KeyRound,
  Lightbulb,
  HelpCircle,
  Tag,
  BrainCircuit,
  Clock,
} from 'lucide-react';
import { TicketReply } from '@/components/ticket-reply';
import { PrioritySelector } from '@/components/priority-selector';

const categoryMeta: Record<string, { icon: typeof Bug; label: string; gradient: string }> = {
  SOFTWARE_BUG: { icon: Bug, label: 'Bug de Software', gradient: 'from-red-500 to-rose-600' },
  BILLING: { icon: CreditCard, label: 'Facturación', gradient: 'from-emerald-500 to-teal-600' },
  ACCOUNT_ACCESS: { icon: KeyRound, label: 'Acceso a Cuenta', gradient: 'from-amber-500 to-orange-600' },
  FEATURE_REQUEST: { icon: Lightbulb, label: 'Sugerencia', gradient: 'from-violet-500 to-purple-600' },
  GENERAL_INQUIRY: { icon: HelpCircle, label: 'Consulta', gradient: 'from-blue-500 to-cyan-600' },
};

const priorityMeta: Record<number, { label: string; color: string }> = {
  0: { label: 'Fuera de scope', color: 'bg-gray-100 text-gray-500' },
  1: { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
  2: { label: 'Media', color: 'bg-blue-50 text-blue-600' },
  3: { label: 'Alta', color: 'bg-amber-50 text-amber-600' },
  4: { label: 'Crítica', color: 'bg-red-50 text-red-600' },
};

const statusMeta: Record<string, { label: string; color: string }> = {
  PENDING_TRIAGE: { label: 'Analizando', color: 'bg-purple-50 text-purple-600' },
  OPEN: { label: 'Abierto', color: 'bg-blue-50 text-blue-600' },
  RESOLVED: { label: 'Resuelto', color: 'bg-emerald-50 text-emerald-600' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-100 text-gray-500' },
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ticket, replies, error } = await getTicket(id);

  if (error || !ticket) {
    notFound();
  }

  const date = new Date(ticket.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const cat = ticket.category ? categoryMeta[ticket.category] : null;
  const pri = priorityMeta[ticket.priority ?? 0];
  const st = statusMeta[ticket.status] ?? { label: ticket.status, color: 'bg-gray-100 text-gray-500' };
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </a>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-muted to-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground">{ticket.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${st.color}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {st.label}
                </span>
                {ticket.priority !== null && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${pri.color}`}>
                    {pri.label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {date}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              {!isResolved && (
                <PrioritySelector ticketId={ticket.id} currentPriority={ticket.priority} />
              )}
              {cat && (
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} shadow-sm`}>
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-b border-border p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Descripción</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{ticket.description}</p>
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="border-b border-border p-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 px-3 py-1 text-xs font-medium text-indigo-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Context */}
        {ticket.ai_context && (
          <div className="border-b border-border p-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <BrainCircuit className="h-3.5 w-3.5" />
              Análisis IA
            </h2>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 shadow-xs">
                  <span className={`h-1.5 w-1.5 rounded-full ${ticket.ai_context.is_recurring_issue ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {ticket.ai_context.is_recurring_issue ? 'Reincidente' : 'No reincidente'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-indigo-600 shadow-xs">
                  {ticket.ai_context.customer_sentiment?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-indigo-900/70">
                {ticket.ai_context.historical_summary}
              </p>
            </div>
          </div>
        )}

        {/* Reply Section */}
        {!isResolved && (
          <div className="p-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Responder ticket
            </h2>
            <TicketReply
              ticketId={ticket.id}
              userId={process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000'}
              aiSuggestion={ticket.ai_suggested_response}
              replies={replies || []}
            />
          </div>
        )}

        {/* Resolution */}
        {isResolved && ticket.resolution && (
          <div className="border-t border-border p-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Resolución
            </h2>
            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900/70">
                {ticket.resolution}
              </p>
            </div>

            {replies && replies.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Conversación</h3>
                {replies.map((reply: any) => (
                  <div key={reply.id} className={`flex gap-3 ${reply.author_type === 'agent' ? 'justify-end' : ''}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        reply.author_type === 'agent'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'border border-border bg-surface'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${reply.author_type === 'agent' ? 'text-white/90' : 'text-gray-600'}`}>
                        {reply.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
