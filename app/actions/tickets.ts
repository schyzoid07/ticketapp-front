'use server';

import { supabaseAdmin } from '@/lib/supabase';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

function getClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase no está configurado. Revisa tus variables de entorno.');
  }
  return supabaseAdmin;
}

export async function createTicket(prevState: { error: string; ticket: TicketData | null }, formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const companyId = formData.get('company_id') as string;
  const userId = formData.get('user_id') as string;
  const userName = formData.get('user_name') as string;

  if (!title || !description) {
    return { error: 'Título y descripción son requeridos', ticket: null };
  }

  try {
    const client = getClient();

    const { data, error } = await client
      .from('tickets')
      .insert({
        title,
        description,
        company_id: companyId || null,
        user_id: userId || null,
        user_name: userName || null,
        status: 'PENDING_TRIAGE',
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear ticket:', error);
      return { error: error.message, ticket: null };
    }

    return { ticket: data as unknown as TicketData, error: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al crear ticket:', message);
    return { error: message, ticket: null };
  }
}

export async function getTickets(companyId: string) {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener tickets:', error);
      return { error: error.message, tickets: [] };
    }

    return { tickets: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al obtener tickets:', message);
    return { error: message, tickets: [] };
  }
}

export async function getTicket(id: string) {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener ticket:', error);
      return { error: error.message };
    }

    const { data: replies, error: repliesError } = await client
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    return { ticket: data, replies: replies || [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al obtener ticket:', message);
    return { error: message };
  }
}

interface ReplyState {
  error: string;
  success: boolean;
}

export async function sendReply(prevState: ReplyState, formData: FormData) {
  const ticketId = formData.get('ticket_id') as string;
  const body = formData.get('body') as string;
  const userId = formData.get('user_id') as string;
  const status = formData.get('status') as string;

  if (!ticketId || !body) {
    return { error: 'Faltan datos requeridos', success: false };
  }

  try {
    const client = getClient();

    const { error: replyError } = await client
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: userId || null,
        author_type: 'agent',
        body,
      });

    if (replyError) {
      return { error: replyError.message, success: false };
    }

    if (status === 'RESOLVED') {
      await client
        .from('tickets')
        .update({
          status: 'RESOLVED',
          resolution: body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
    }

    return { success: true, error: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
  }
}
