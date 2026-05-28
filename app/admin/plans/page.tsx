import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getCompanyPlan } from '@/app/actions/tickets';
import { ArrowLeft, CheckCircle2, XCircle, Crown, Zap, Shield, MessageSquare, BarChart3 } from 'lucide-react';

export default async function AdminPlansPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const currentRole = user.user_metadata?.role as string;
  if (currentRole !== 'owner' && currentRole !== 'admin') redirect('/dashboard');

  const companyId = user.user_metadata?.company_id as string;
  const { plan, error } = await getCompanyPlan(companyId);

  if (error || !plan) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Error al cargar información del plan: {error || 'No hay datos'}
        </div>
      </div>
    );
  }

  const currentPlan = plan.plan as 'basic' | 'complete';
  const isBasic = currentPlan === 'basic';

  const FeatureRow = ({ included, label }: { included: boolean; label: string }) => (
    <div className="flex items-center gap-3 py-2.5">
      {included ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-gray-300" />
      )}
      <span className={`text-sm ${included ? 'text-foreground' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </a>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Planes</h1>
          <p className="text-xs text-gray-500">
            {plan.name} — Plan actual: <span className="font-semibold text-amber-600">{isBasic ? 'Básico' : 'Completo'}</span>
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className={`mb-8 rounded-2xl border-2 p-6 shadow-xs ${
        isBasic
          ? 'border-gray-200 bg-surface'
          : 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
      }`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isBasic ? 'bg-gray-200' : 'bg-gradient-to-br from-amber-500 to-orange-600'
            }`}>
              {isBasic ? (
                <Zap className="h-5 w-5 text-gray-500" />
              ) : (
                <Crown className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isBasic ? 'Plan Básico' : 'Plan Completo'}
              </h2>
              <p className="text-xs text-gray-500">
                {isBasic ? 'Gratuito — ideal para empezar' : 'Análisis completo con IA'}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isBasic
              ? 'bg-gray-100 text-gray-600'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isBasic ? 'ACTIVO' : 'ACTIVO'}
          </span>
        </div>

        {isBasic && currentRole === 'owner' && (
          <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              ¿Necesitas más funcionalidades? Actualiza al Plan Completo y desbloquea el análisis contextual completo, respuesta automática y mayor límite de tokens.
            </p>
            <button
              disabled
              className="mt-3 inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white opacity-60"
            >
              Ir a pricing
            </button>
          </div>
        )}

        {isBasic && currentRole === 'admin' && (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Tu empresa tiene el plan Basic. Pídele al dueño de la empresa que actualice al plan Complete para acceder al análisis completo de IA.
            </p>
          </div>
        )}

        {!isBasic && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              Disfrutas de todas las funcionalidades del Plan Completo.
            </p>
          </div>
        )}
      </div>

      {/* Plans Comparison */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Plan */}
        <div className={`rounded-2xl border-2 p-6 shadow-xs ${
          isBasic ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-surface'
        }`}>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-bold text-foreground">Básico</h3>
            {isBasic && (
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                PLAN ACTUAL
              </span>
            )}
          </div>
          <p className="mb-4 text-2xl font-bold text-foreground">
            Gratis
          </p>
          <div className="border-t border-border pt-3">
            <FeatureRow included label="Triaje automático (clasificación + prioridad)" />
            <FeatureRow included label="Asignación a agentes" />
            <FeatureRow included label="Filtros y dashboard" />
            <FeatureRow included label="Respuestas manuales" />
            <FeatureRow included label="10,000 tokens/mes" />
            <FeatureRow included={false} label="Análisis de contexto e historial" />
            <FeatureRow included={false} label="Sugerencia automática de respuesta" />
            <FeatureRow included={false} label="100,000 tokens/mes" />
          </div>
        </div>

        {/* Complete Plan */}
        <div className={`rounded-2xl border-2 p-6 shadow-xs ${
          !isBasic ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-surface'
        }`}>
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-foreground">Completo</h3>
            {!isBasic && (
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                PLAN ACTUAL
              </span>
            )}
          </div>
          <p className="mb-4 text-2xl font-bold text-foreground">
            Próximamente
          </p>
          <div className="border-t border-border pt-3">
            <FeatureRow included label="Triaje automático (clasificación + prioridad)" />
            <FeatureRow included label="Asignación a agentes" />
            <FeatureRow included label="Filtros y dashboard" />
            <FeatureRow included label="Respuestas manuales" />
            <FeatureRow included label="100,000 tokens/mes" />
            <FeatureRow included label="Análisis de contexto e historial" />
            <FeatureRow included label="Sugerencia automática de respuesta IA" />
            <FeatureRow included label="Pipeline completo de 3 agentes" />
          </div>
        </div>
      </div>
    </div>
  );
}
