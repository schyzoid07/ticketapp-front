import { TicketList } from '@/components/ticket-list';
import { getTickets } from '@/app/actions/tickets';

export default async function DashboardPage() {
  const companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '00000000-0000-0000-0000-000000000000';
  const { tickets } = await getTickets(companyId);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Todos los tickets de soporte</p>
        </div>
        <a
          href="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo ticket
        </a>
      </div>

      <TicketList initialTickets={tickets} companyId={companyId} />
    </div>
  );
}
