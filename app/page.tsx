import { HeadphonesIcon, ArrowRight, Building2, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <HeadphonesIcon className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Plataforma de Soporte
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Gestiona los tickets de soporte de tu empresa con inteligencia artificial
        </p>
      </div>

      <div className="space-y-4">
        <a
          href="/signup"
          className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Registrar mi empresa</p>
            <p className="text-xs text-gray-400">Crea tu espacio de soporte y comparte el enlace con tus clientes</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
        </a>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-xs text-gray-400">o si eres cliente</span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center">
          <UserPlus className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-500">
            Ingresa el enlace que te compartió tu empresa de soporte
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Ej: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">ticketapp.vercel.app/tu-empresa</code>
          </p>
        </div>
      </div>
    </div>
  );
}
