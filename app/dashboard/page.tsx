import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Plus } from 'lucide-react';
import { TicketList } from '@/components/ticket-list';
import { TicketFilters } from '@/components/ticket-filters';
import { getTickets, getCompanyById, getCompanyAgents } from '@/app/actions/tickets';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function DashboardPage(props: { searchParams?: Promise<Record<string, string>> }) {
  const searchParams = await props.searchParams;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const companyId = user.user_metadata?.company_id as string;
  const userId = user.id;
  const userRole = user.user_metadata?.role as string;
  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const filters = {
    priority: searchParams?.priority,
    status: searchParams?.status,
    from: searchParams?.from,
    to: searchParams?.to,
    assigned_to: searchParams?.assigned_to,
  };

  const [{ tickets }, { company }, { agents }] = await Promise.all([
    getTickets(companyId, filters),
    getCompanyById(companyId),
    isAdmin ? getCompanyAgents(companyId) : Promise.resolve({ agents: [] }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-gray-500">{tickets.length} tickets {company ? `· ${company.name}` : ''}</p>
          </div>
        </div>
        <a
          href={company?.slug ? `/${company.slug}` : '/'}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </a>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <TicketFilters userId={userId} userRole={userRole} agents={agents} />
        </Suspense>
      </div>

      <TicketList initialTickets={tickets} companyId={companyId} />
    </div>
  );
}
