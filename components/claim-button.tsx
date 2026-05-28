'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCheck } from 'lucide-react';
import { claimTicket } from '@/app/actions/tickets';
import type { ClaimTicketState } from '@/lib/types';

export function ClaimButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();

  async function handleClaim() {
    const result = await claimTicket(ticketId);
    if (result.success) {
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<ClaimTicketState, FormData>(
    async () => handleClaim(),
    { error: '', success: false }
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-400 hover:shadow-md disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
        Tomar ticket
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">
          {state.error === 'No autenticado' ? 'Debe iniciar sesión' :
           state.error.includes('Failed to fetch') ? 'Error de conexión' :
           state.error}
        </p>
      )}
    </form>
  );
}
