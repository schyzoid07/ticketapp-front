'use client';

import { useActionState } from 'react';
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '@/app/actions/tickets';
import { useState } from 'react';

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<{ error: string; success: boolean }, FormData>(changePassword, { error: '', success: false });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (state.success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        <p className="text-sm text-emerald-700">Contraseña actualizada exitosamente</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="current_password" className="mb-1 block text-xs text-gray-500">Contraseña actual</label>
        <div className="relative">
          <input
            id="current_password"
            name="current_password"
            type={showCurrent ? 'text' : 'password'}
            required
            minLength={6}
            className="block w-full rounded-xl border border-border bg-muted px-4 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="new_password" className="mb-1 block text-xs text-gray-500">Nueva contraseña</label>
        <div className="relative">
          <input
            id="new_password"
            name="new_password"
            type={showNew ? 'text' : 'password'}
            required
            minLength={6}
            className="block w-full rounded-xl border border-border bg-muted px-4 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm_password" className="mb-1 block text-xs text-gray-500">Confirmar nueva contraseña</label>
        <div className="relative">
          <input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? 'text' : 'password'}
            required
            minLength={6}
            className="block w-full rounded-xl border border-border bg-muted px-4 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        Cambiar contraseña
      </button>
    </form>
  );
}
