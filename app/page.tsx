import { TicketForm } from '@/components/ticket-form';

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Soporte Técnico</h1>
        <p className="mt-2 text-sm text-gray-600">
          Describe tu problema y nuestro sistema IA lo analizará automáticamente
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <TicketForm
          companyId={process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '00000000-0000-0000-0000-000000000000'}
          userId={process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000'}
          userName={process.env.NEXT_PUBLIC_DEFAULT_USER_NAME || 'Usuario'}
        />
      </div>
    </div>
  );
}
