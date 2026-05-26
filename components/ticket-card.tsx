import type { Ticket } from '@/lib/types';
import {
  Bug,
  CreditCard,
  KeyRound,
  Lightbulb,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

const categoryIcons: Record<string, typeof Bug> = {
  SOFTWARE_BUG: Bug,
  BILLING: CreditCard,
  ACCOUNT_ACCESS: KeyRound,
  FEATURE_REQUEST: Lightbulb,
  GENERAL_INQUIRY: HelpCircle,
};

const statusColors: Record<string, string> = {
  RESOLVED: 'text-emerald-600 bg-emerald-50',
  CLOSED: 'text-gray-400 bg-gray-100',
  PENDING_TRIAGE: 'text-purple-600 bg-purple-50',
  OPEN: '',
};

const priorityIconColors: Record<number, string> = {
  1: 'text-blue-600 bg-blue-50',
  2: 'text-yellow-600 bg-yellow-50',
  3: 'text-red-600 bg-red-50',
  4: 'text-purple-600 bg-purple-50',
};

const priorityConfig: Record<number, { label: string; dot: string }> = {
  1: { label: 'Baja', dot: 'bg-gray-400' },
  2: { label: 'Media', dot: 'bg-blue-500' },
  3: { label: 'Alta', dot: 'bg-amber-500' },
  4: { label: 'Crítica', dot: 'bg-red-500' },
};

const statusConfig: Record<string, { label: string; dot: string }> = {
  PENDING_TRIAGE: { label: 'Analizando', dot: 'bg-purple-500' },
  OPEN: { label: 'Abierto', dot: 'bg-blue-500' },
  RESOLVED: { label: 'Resuelto', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Cerrado', dot: 'bg-gray-400' },
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const date = new Date(ticket.created_at).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const CategoryIcon = ticket.category ? categoryIcons[ticket.category] : HelpCircle;
  const pri = priorityConfig[ticket.priority ?? 0];
  const st = statusConfig[ticket.status] ?? { label: ticket.status, dot: 'bg-gray-400' };
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  const iconColorClass = isResolved
    ? 'text-emerald-600 bg-emerald-50'
    : (ticket.priority ? priorityIconColors[ticket.priority] : 'text-indigo-600 bg-indigo-50');

  return (
    <a
      href={`/tickets/${ticket.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/10"
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${iconColorClass}`}>
          <CategoryIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{ticket.title}</h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{ticket.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${pri?.dot ?? 'bg-gray-300'}`} />
              {pri?.label ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            {ticket.tags && ticket.tags.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400">
                {ticket.tags.slice(0, 2).map((t: string) => (
                  <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{t}</span>
                ))}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">{date}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
