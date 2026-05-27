'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, User, Globe, Loader2, AlertCircle, CheckCircle2, ArrowRight, Link as LinkIcon, Copy } from 'lucide-react';
import { registerCompany } from '@/app/actions/tickets';
import { useState } from 'react';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(registerCompany, { error: '', success: false });
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (state.success) {
    const ticketLink = `${window.location.origin}/${state.slug}`;
    const handleCopy = () => {
      navigator.clipboard.writeText(ticketLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

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
          <p className="text-lg font-semibold text-foreground">{state.companyName} creada</p>
          <p className="mt-1 text-sm text-gray-500">Revisa tu correo para confirmar la cuenta</p>

          <div className="mt-6 w-full rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-600">Tu enlace de tickets</p>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-amber-400" />
              <code className="min-w-0 truncate text-sm text-amber-700">{ticketLink}</code>
              <button
                onClick={handleCopy}
                className="ml-auto shrink-0 rounded-lg bg-white/60 px-2.5 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-white"
              >
                {copied ? 'Copiado' : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-500/70">
              Comparte este enlace con tus clientes para que puedan reportar tickets
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
          >
            Ir a iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Registrar empresa</h1>
        <p className="mt-1 text-sm text-gray-500">Crea tu espacio de soporte técnico</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-foreground/70">
            Nombre de la empresa
          </label>
          <div className="relative mt-1.5">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="company_name"
              name="company_name"
              required
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="Mi Empresa S.A."
            />
          </div>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground/70">
            Dirección web
          </label>
          <div className="relative mt-1.5">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="mi-empresa"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Tus clientes irán a: ticketapp.vercel.app/<span className="font-mono">mi-empresa</span>
            <br />
            <span className="text-gray-400">Usa solo letras minúsculas, números y guiones. Ej: <span className="font-mono">acme-corp</span></span>
          </p>
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-foreground/70">
            Tu nombre
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="Admin"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground/70">
            Correo electrónico
          </label>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              required
              className="block w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="admin@empresa.com"
            />
          </div>
        </div>

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
            <Building2 className="h-4 w-4" />
          )}
          Crear empresa
        </button>

        <p className="text-center text-xs text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-amber-600 hover:text-amber-500">
            Inicia sesión
          </a>
        </p>
      </form>
    </div>
  );
}
