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

    return { ticket: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al obtener ticket:', message);
    return { error: message };
  }
}
