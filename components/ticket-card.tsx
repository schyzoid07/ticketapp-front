const priorityColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-red-100 text-red-700',
};

const priorityLabels: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
  4: 'Crítica',
};

const statusColors: Record<string, string> = {
  PENDING_TRIAGE: 'bg-purple-100 text-purple-700',
  OPEN: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <a
      href={`/tickets/${ticket.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-900">{ticket.title}</h3>
        <div className="flex gap-2">
          {ticket.priority && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}>
              {priorityLabels[ticket.priority]}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
            {ticket.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      {ticket.category && (
        <p className="mt-1 text-xs font-medium text-gray-500">{ticket.category.replace(/_/g, ' ')}</p>
      )}
      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{ticket.description}</p>
      <p className="mt-3 text-xs text-gray-400">{date}</p>
    </a>
  );
}
