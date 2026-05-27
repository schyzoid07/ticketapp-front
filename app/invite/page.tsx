'use client';

import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, AlertCircle, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { acceptInvitation } from '@/app/actions/tickets';

export default function InvitePageWrapper() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-24 text-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    }>
      <InvitePage />
    </Suspense>
  );
}

function InvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [state, formAction, pending] = useActionState(acceptInvitation, { error: '', success: false });

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mx-auto">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Enlace inválido</h1>
        <p className="mt-1 text-sm text-gray-500">Este enlace de invitación no es válido o ya expiró.</p>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-foreground">Cuenta creada</p>
          <p className="mt-1 text-sm text-gray-500">Ya puedes iniciar sesión con tu correo y contraseña</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
          >
            Iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-24">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <KeyRound className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Aceptar invitación</h1>
        <p className="mt-1 text-sm text-gray-500">Crea tu contraseña para unirte al equipo</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground/70">
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-foreground/70">
            Confirmar contraseña
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="confirm"
              name="confirm"
              required
              minLength={6}
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="••••••••"
              onChange={(e) => {
                const pass = (document.getElementById('password') as HTMLInputElement)?.value;
                if (e.target.value && e.target.value !== pass) {
                  e.target.setCustomValidity('Las contraseñas no coinciden');
                } else {
                  e.target.setCustomValidity('');
                }
              }}
            />
          </div>
        </div>

        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600">{state.error}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Crear cuenta y unirme
        </button>
      </form>
    </div>
  );
}
