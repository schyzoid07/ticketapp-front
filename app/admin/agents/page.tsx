import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import type { AgentUser } from '@/lib/types';
import { getAgents, getAgentResolvedCount } from '@/app/actions/tickets';
import { Users, Shield, Wrench, TicketCheck, ArrowLeft, UserPlus, Crown } from 'lucide-react';
import { InviteAgentForm } from '@/components/invite-agent-form';

export default async function AdminAgentsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const currentRole = user.user_metadata?.role as string;
  const canView = currentRole === 'owner' || currentRole === 'admin';
  if (!canView) redirect('/dashboard');

  const companyId = user.user_metadata?.company_id as string;
  const { agents } = await getAgents(companyId);

  const resolvedCounts: Record<string, number> = {};
  for (const agent of agents) {
    if (agent.role !== 'owner') {
      const { count } = await getAgentResolvedCount(agent.id);
      resolvedCounts[agent.id] = count;
    }
  }

  const roleConfig: Record<string, { icon: typeof Shield; label: string; style: string }> = {
    owner: { icon: Crown, label: 'Dueño', style: 'bg-amber-100 text-amber-600' },
    admin: { icon: Shield, label: 'Admin', style: 'bg-indigo-100 text-indigo-600' },
    agent: { icon: Wrench, label: 'Agente', style: 'bg-amber-50 text-amber-600' },
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </a>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Equipo</h1>
          <p className="text-xs text-gray-500">{agents.length} miembros</p>
        </div>
      </div>

      {/* Agent List */}
      <div className="mb-8 space-y-3">
        {agents.map((agent: AgentUser) => {
          const cfg = roleConfig[agent.role] || roleConfig.agent;
          const Icon = cfg.icon;
          return (
            <div
              key={agent.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.style}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{agent.full_name || 'Sin nombre'}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cfg.style}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{agent.email}</p>
              </div>
              {agent.role !== 'owner' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <TicketCheck className="h-3.5 w-3.5" />
                  <span className="font-medium tabular-nums">{resolvedCounts[agent.id] ?? 0}</span>
                  <span className="text-gray-400">resueltos</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Form */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-gray-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Invitar miembro
          </h2>
        </div>
        <InviteAgentForm companyId={companyId} canInviteAdmin={currentRole === 'owner'} />
      </div>
    </div>
  );
}
