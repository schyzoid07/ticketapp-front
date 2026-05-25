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

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  priority: number | null;
  created_at: string;
}

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

  return (
    <a
      href={`/tickets/${ticket.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/10"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-purple-100">
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
            <span className="ml-auto text-xs text-gray-400">{date}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
