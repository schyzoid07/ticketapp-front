import { notFound } from 'next/navigation';
import { HeadphonesIcon, Building2 } from 'lucide-react';
import { getCompanyBySlug } from '@/app/actions/tickets';
import { PublicTicketForm } from '@/components/public-ticket-form';

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const reservedRoutes = ['login', 'dashboard', 'tickets', 'auth'];
  if (reservedRoutes.includes(slug)) notFound();

  const { company } = await getCompanyBySlug(slug);

  if (!company) notFound();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <HeadphonesIcon className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Soporte {company.name}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span>¿En qué podemos ayudarte?</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <PublicTicketForm companyId={company.id} companyName={company.name} />
      </div>
    </div>
  );
}
