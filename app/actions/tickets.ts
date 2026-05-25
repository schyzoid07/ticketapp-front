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
  const email = formData.get('email') as string;

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
        email: email || null,
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

export async function setTicketPriority(ticketId: string, priority: number) {
  try {
    const client = getClient();
    const { error } = await client
      .from('tickets')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function registerCompany(prevState: { error: string; success: boolean }, formData: FormData) {
  const companyName = formData.get('company_name') as string;
  const slug = formData.get('slug') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!companyName || !slug || !email || !password || !fullName) {
    return { error: 'Todos los campos son requeridos', success: false };
  }

  try {
    const client = getClient();

    const { data: existing } = await client
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return { error: 'Este slug ya está en uso', success: false };
    }

    const { data: company, error: companyError } = await client
      .from('companies')
      .insert({ name: companyName, slug })
      .select()
      .single();

    if (companyError) throw new Error(companyError.message);

    const { data: userRecord, error: userError } = await client
      .from('users')
      .insert({
        company_id: company.id,
        email,
        full_name: fullName,
        role: 'admin',
      })
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    const { createClient } = await import('@supabase/supabase-js');
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_id: company.id,
          full_name: fullName,
          role: 'admin',
        },
      },
    });

    if (authError) throw new Error(authError.message);

    return { error: '', success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
  }
}

export async function getCompanyBySlug(slug: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('companies')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (error) return { company: null, error: null };
    return { company: data, error: null };
  } catch {
    return { company: null, error: null };
  }
}

export async function getTickets(
  companyId: string,
  filters?: { priority?: string; status?: string; from?: string; to?: string }
) {
  try {
    const client = getClient();

    let query = client
      .from('tickets')
      .select('*')
      .eq('company_id', companyId);

    if (filters?.priority) {
      query = query.eq('priority', parseInt(filters.priority));
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }

    if (filters?.to) {
      query = query.lte('created_at', filters.to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
