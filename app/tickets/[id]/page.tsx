import { getTicket } from '@/app/actions/tickets';
import { notFound } from 'next/navigation';

const categoryLabels: Record<string, string> = {
  SOFTWARE_BUG: 'Bug de Software',
  BILLING: 'Facturación',
  ACCOUNT_ACCESS: 'Acceso a Cuenta',
  FEATURE_REQUEST: 'Solicitud de Funcionalidad',
  GENERAL_INQUIRY: 'Consulta General',
};

const priorityLabels: Record<string, string> = {
  '1': 'Baja',
  '2': 'Media',
  '3': 'Alta',
  '4': 'Crítica',
};

const priorityColors: Record<string, string> = {
  '1': 'bg-gray-100 text-gray-700',
  '2': 'bg-blue-100 text-blue-700',
  '3': 'bg-yellow-100 text-yellow-700',
  '4': 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  PENDING_TRIAGE: 'bg-purple-100 text-purple-700',
  OPEN: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ticket, error } = await getTicket(id);

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <a href="/dashboard" className="mb-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
        &larr; Volver al dashboard
      </a>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Creado el {date}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                {ticket.status.replace(/_/g, ' ')}
              </span>
              {ticket.priority && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[String(ticket.priority)]}`}>
                  {priorityLabels[String(ticket.priority)]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Descripción</h2>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{ticket.description}</p>
        </div>

        {ticket.category && (
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Categoría</h2>
            <p className="mt-1 text-gray-700">{categoryLabels[ticket.category] || ticket.category}</p>
          </div>
        )}

        {ticket.tags && ticket.tags.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tags</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {ticket.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {ticket.ai_context && (
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Análisis IA</h2>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-800">
                  Reincidente: {ticket.ai_context.is_recurring_issue ? 'Sí' : 'No'}
                </p>
                <p className="mt-1 text-sm text-purple-700">
                  Sentimiento: {ticket.ai_context.customer_sentiment?.replace(/_/g, ' ')}
                </p>
                <p className="mt-2 text-sm text-purple-600">{ticket.ai_context.historical_summary}</p>
              </div>
            </div>
          </div>
        )}

        {ticket.ai_suggested_response && (
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Respuesta Sugerida</h2>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="prose prose-sm max-w-none text-blue-900">
                {ticket.ai_suggested_response.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
