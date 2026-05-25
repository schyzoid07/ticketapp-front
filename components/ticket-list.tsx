'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/50 px-4 py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
          <Inbox className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No hay tickets</p>
        <p className="mt-1 text-xs text-gray-400">Crea tu primer ticket para empezar</p>
        <a
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-md"
        >
          Nuevo ticket
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {tickets.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <TicketCard ticket={ticket} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
