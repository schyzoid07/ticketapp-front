import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getCompanyById, updateCompanyName, updateCompanyWebhook } from '@/app/actions/tickets';
import { CopyButton } from '@/components/copy-button';
import {
  User,
  Building2,
  Globe,
  Crown,
  Shield,
  Wrench,
  Save,
  ArrowLeft,
  Webhook,
  ExternalLink,
} from 'lucide-react';

const roleLabels: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Dueño', icon: Crown, color: 'bg-amber-100 text-amber-600' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-amber-100 text-amber-600' },
  agent: { label: 'Agente', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
};

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const companyId = user.user_metadata?.company_id as string;
  const role = user.user_metadata?.role as string;
  const isOwner = role === 'owner';

  const { company } = await getCompanyById(companyId);
  const roleMeta = roleLabels[role] || roleLabels.agent;
  const RoleIcon = roleMeta.icon;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ticketapp-front.vercel.app';
  const ticketLink = company?.slug ? `${siteUrl}/${company.slug}` : null;

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </a>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-muted to-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleMeta.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleMeta.label}
                </span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="border-b border-border p-6">
          <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <Building2 className="h-3.5 w-3.5" />
            Empresa
          </h2>

          {company && (
            <div className="space-y-4">
              {isOwner ? (
                <form action={updateCompanyName} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">Nombre de la empresa</label>
                    <input
                      name="name"
                      defaultValue={company.name}
                      className="block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </button>
                </form>
              ) : (
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Nombre de la empresa</label>
                  <p className="text-sm font-medium text-foreground">{company.name}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-gray-500">Dirección web (slug)</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                  <code className="text-sm text-gray-600">{company.slug}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public Ticket Link (Owner only) */}
        {isOwner && ticketLink && (
          <div className="border-b border-border p-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Globe className="h-3.5 w-3.5" />
              Enlace público de tickets
            </h2>
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
              <p className="mb-2 text-xs text-gray-500">
                Comparte este enlace con tus clientes para que puedan reportar tickets:
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 truncate rounded-lg bg-white/60 px-3 py-2 text-sm text-amber-700">
                  {ticketLink}
                </code>
                <CopyButton text={ticketLink} />
              </div>
            </div>
          </div>
        )}

        {/* Outbound Webhook (Owner only) */}
        {isOwner && (
          <div className="p-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Webhook className="h-3.5 w-3.5" />
              Webhook de salida
            </h2>
            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="mb-3 text-xs leading-relaxed text-gray-500">
                Cuando un agente resuelve un ticket, TicketSupport enviará un POST con los datos al webhook que configures.
                Puedes usar <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 underline underline-offset-2">n8n <ExternalLink className="h-3 w-3" /></a>, Slack, Discord, Make, Zapier o cualquier servicio que acepte webhooks.
              </p>
              <form action={updateCompanyWebhook} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">URL del webhook</label>
                  <input
                    name="webhook_url"
                    type="url"
                    defaultValue={company?.webhook_url || ''}
                    placeholder="https://tu-servidor.webhook/ticket-resolved"
                    className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
