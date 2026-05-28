'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';
import { toggleAgentBlock } from '@/app/actions/tickets';

export function ToggleAgentBlock({ agentId, blocked }: { agentId: string; blocked: boolean | null }) {
  const router = useRouter();

  async function handleToggle() {
    const result = await toggleAgentBlock(agentId);
    if (result.success) {
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<{ error?: string; success?: boolean; blocked?: boolean }, FormData>(
    async () => handleToggle(),
    { success: false }
  );

  const isBlocked = state.blocked ?? (blocked ?? false);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
          isBlocked
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isBlocked ? (
          <ShieldCheck className="h-3.5 w-3.5" />
        ) : (
          <ShieldOff className="h-3.5 w-3.5" />
        )}
        {isBlocked ? 'Desbloquear' : 'Bloquear'}
      </button>
      {state.error && (
        <p className="mt-1 text-[10px] text-red-500">{state.error}</p>
      )}
    </form>
  );
}
