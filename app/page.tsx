import { HeadphonesIcon } from "lucide-react";
import { TicketForm } from "@/components/ticket-form";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <HeadphonesIcon className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ¿En qué podemos ayudarte?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Describe tu problema y nuestro sistema lo analizará al instante
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <TicketForm
          companyId={process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '00000000-0000-0000-0000-000000000000'}
          userId={process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000'}
          userName={process.env.NEXT_PUBLIC_DEFAULT_USER_NAME || 'Usuario'}
        />
      </div>
    </div>
  );
}
