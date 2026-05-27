import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeadphonesIcon, Building2, Home, SearchX } from 'lucide-react';
import { getCompanyBySlug } from '@/app/actions/tickets';
import { PublicTicketForm } from '@/components/public-ticket-form';

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const reservedRoutes = ['login', 'dashboard', 'tickets', 'auth'];
  if (reservedRoutes.includes(slug)) notFound();

  const { company } = await getCompanyBySlug(slug);

  if (!company) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
          <SearchX className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Empresa no encontrada
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          La dirección <span className="font-mono text-amber-600">/{slug}</span> no corresponde a ninguna empresa registrada en TicketSupport.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Verifica la dirección o contacta al equipo de soporte de la empresa.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
        >
          <Home className="h-4 w-4" />
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
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
