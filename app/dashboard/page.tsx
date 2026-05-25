import { LayoutDashboard, Plus } from "lucide-react";
import { TicketList } from "@/components/ticket-list";
import { getTickets } from "@/app/actions/tickets";

export default async function DashboardPage() {
  const companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '00000000-0000-0000-0000-000000000000';
  const { tickets } = await getTickets(companyId);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-gray-500">{tickets.length} tickets</p>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </a>
      </div>

      <TicketList initialTickets={tickets} companyId={companyId} />
    </div>
  );
}
