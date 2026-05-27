'use client';

import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Shield, Wrench, Link as LinkIcon, Copy } from 'lucide-react';
import { createInvitation } from '@/app/actions/tickets';
import { useState } from 'react';

export function InviteAgentForm({ companyId, canInviteAdmin }: { companyId: string; canInviteAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(createInvitation, { error: '', success: false });
  const [copied, setCopied] = useState(false);

  if (state.success && state.link) {
    const handleCopy = () => {
      navigator.clipboard.writeText(state.link!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">Invitación creada</p>
        </div>
        <div className="space-y-3 rounded-xl bg-white/60 p-4 text-sm">
          <p className="text-gray-600">Comparte este enlace con el invitado:</p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-2.5">
            <LinkIcon className="h-4 w-4 shrink-0 text-amber-400" />
            <code className="min-w-0 truncate text-xs text-amber-700">{state.link}</code>
            <button
              onClick={handleCopy}
              className="ml-auto shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-amber-600 shadow-xs transition-colors hover:bg-amber-50"
            >
              {copied ? 'Copiado' : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-xs text-gray-400">El invitado creará su propia contraseña al aceptar</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="company_id" value={companyId} />

      {canInviteAdmin && (
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            Rol
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors has-[:checked]:border-amber-300 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-700">
              <input type="radio" name="role" value="agent" defaultChecked className="sr-only" />
              <Wrench className="h-4 w-4" />
              <span>Agente</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors has-[:checked]:border-amber-300 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-700">
              <input type="radio" name="role" value="admin" className="sr-only" />
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </label>
          </div>
        </div>
      )}

      {!canInviteAdmin && <input type="hidden" name="role" value="agent" />}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground/70">
          Nombre completo
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          className="mt-1.5 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="Ej: María García"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground/70">
          Correo electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1.5 block w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          placeholder="correo@empresa.com"
        />
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
          <UserPlus className="h-4 w-4" />
        )}
        Generar enlace de invitación
      </button>
    </form>
  );
}
