'use client';

import { useEffect, useState } from 'react';
import { TicketCard } from './ticket-card';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  priority: number | null;
  created_at: string;
}

export function TicketList({ initialTickets, companyId }: { initialTickets: Ticket[]; companyId: string }) {
  const [tickets, setTickets] = useState(initialTickets);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) return;

    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(supabaseUrl, anonKey);

    const channel = client
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new as Ticket, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Ticket) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [companyId]);

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No hay tickets aún</p>
        <a href="/" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
          Crear el primer ticket
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
