import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Plus, Ban } from 'lucide-react';
import { TicketList } from '@/components/ticket-list';
import { TicketFilters } from '@/components/ticket-filters';
import { getTickets, getCompanyById, getCompanyAgents, getCompanyTags, checkUserBlocked } from '@/app/actions/tickets';
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
  const isAgent = userRole === 'agent';

  const isBlocked = isAgent ? await checkUserBlocked(userId) : false;

  const filters = {
    priority: searchParams?.priority,
    status: searchParams?.status,
    from: searchParams?.from,
    to: searchParams?.to,
    assigned_to: searchParams?.assigned_to || undefined,
    tag: searchParams?.tag || undefined,
  };

  const [{ tickets }, { company }, { agents }, { tags }] = await Promise.all([
    getTickets(companyId, filters),
    getCompanyById(companyId),
    isAdmin ? getCompanyAgents(companyId) : Promise.resolve({ agents: [] }),
    getCompanyTags(companyId),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      {isBlocked && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <Ban className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-800">Su usuario ha sido bloqueado</p>
              <p className="mt-1 text-sm text-red-700/70">
                Un administrador ha bloqueado su cuenta. No puede tomar ni responder tickets hasta que un administrador lo desbloquee.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <TicketFilters userId={userId} userRole={userRole} agents={agents} tags={tags} />
        </Suspense>
      </div>

      <TicketList initialTickets={tickets} companyId={companyId} />
    </div>
  );
}
