'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, ChevronDown, Loader2 } from 'lucide-react';
import type { Ticket } from '@/lib/types';
import { TicketCard } from './ticket-card';

const PAGE_SIZE = 10;

export function TicketList({ initialTickets, companyId }: { initialTickets: Ticket[]; companyId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets.slice(0, PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(initialTickets.length / PAGE_SIZE);
  const hasMore = page < totalPages;

  useEffect(() => {
    setTickets(initialTickets.slice(0, PAGE_SIZE));
    setPage(1);
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
            setTickets((prev) => {
              const next = [payload.new as Ticket, ...prev];
              return next.slice(0, PAGE_SIZE * page);
            });
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
  }, [companyId, page]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    setTickets(initialTickets.slice(0, PAGE_SIZE * nextPage));
    setPage(nextPage);
    setLoading(false);
  }, [page, hasMore, loading, initialTickets]);

  if (initialTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/50 px-4 py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
          <Inbox className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No hay tickets</p>
        <p className="mt-1 text-xs text-gray-400">Crea tu primer ticket para empezar</p>
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

      <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
        <span>{tickets.length} de {initialTickets.length} tickets</span>
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-gray-500 transition-colors hover:bg-muted hover:text-gray-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Cargar más
          </button>
        )}
      </div>
    </div>
  );
}
