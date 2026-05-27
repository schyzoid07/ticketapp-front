'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase-server';
import type { TicketData, ReplyState } from '@/lib/types';
import {
  CreateTicketSchema,
  RegisterCompanySchema,
  AcceptInvitationSchema,
  CreateInvitationSchema,
  SendReplySchema,
  TicketDataSchema,
} from '@/lib/schemas';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateStore = new Map<string, RateEntry>();

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim()
    || h.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetMinutes: number } {
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetMinutes: 15 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, resetMinutes };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetMinutes: Math.ceil((entry.resetAt - now) / 60000) };
}

async function requireUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return user;
}

function requireRole(user: { user_metadata?: { role?: string } }, ...roles: string[]) {
  const role = user.user_metadata?.role;
  if (!role || !roles.includes(role)) {
    throw new Error(`Se requiere rol: ${roles.join(' o ')}`);
  }
}

function getClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase no está configurado. Revisa tus variables de entorno.');
  }
  return supabaseAdmin;
}

export async function createTicket(prevState: { error: string; ticket: TicketData | null; rateLimit?: { remaining: number; resetMinutes: number } }, formData: FormData) {
  const parsed = CreateTicketSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    company_id: formData.get('company_id'),
    user_id: formData.get('user_id'),
    user_name: formData.get('user_name'),
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), ticket: null };
  }

  const { title, description, company_id: companyId, user_id: userId, user_name: userName, email } = parsed.data;

  const clientIp = await getClientIp();
  const rateKey = userId || clientIp;
  const rateCheck = checkRateLimit(rateKey);
  if (!rateCheck.allowed) {
    return {
      error: `Límite de tickets alcanzado. Intenta de nuevo en ${rateCheck.resetMinutes} minutos.`,
      ticket: null,
      rateLimit: { remaining: 0, resetMinutes: rateCheck.resetMinutes },
    };
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

    const validated = TicketDataSchema.safeParse(data);
    if (!validated.success) {
      console.error('Respuesta de Supabase inválida:', validated.error);
      return { error: 'Error inesperado al crear ticket', ticket: null };
    }

    return { ticket: validated.data, error: '', rateLimit: { remaining: rateCheck.remaining, resetMinutes: rateCheck.resetMinutes } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al crear ticket:', message);
    return { error: message, ticket: null };
  }
}

export async function setTicketPriority(ticketId: string, priority: number) {
  try {
    const user = await requireUser();
    requireRole(user, 'owner', 'admin');

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

export async function registerCompany(prevState: { error: string; success: boolean; slug?: string; companyName?: string }, formData: FormData) {
  const parsed = RegisterCompanySchema.safeParse({
    company_name: formData.get('company_name'),
    slug: formData.get('slug'),
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
  }

  const { company_name: companyName, slug, email, password, full_name: fullName } = parsed.data;

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

    const { createClient } = await import('@supabase/supabase-js');
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_id: company.id,
          full_name: fullName,
          role: 'owner',
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Error al crear usuario de autenticación');

    const authUserId = authData.user.id;

    const { error: userError } = await client
      .from('users')
      .insert({
        id: authUserId,
        company_id: company.id,
        email,
        full_name: fullName,
        role: 'owner',
      })
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    return { error: '', success: true, slug: company.slug, companyName: company.name };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
  }
}

export async function createInvitation(prevState: { error: string; success: boolean; link?: string }, formData: FormData) {
  try {
    const user = await requireUser();
    const currentRole = user.user_metadata?.role;
    requireRole(user, 'owner', 'admin');

    const parsed = CreateInvitationSchema.safeParse({
      company_id: formData.get('company_id'),
      email: formData.get('email'),
      full_name: formData.get('full_name'),
      role: formData.get('role'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
    }

    const { company_id: companyId, email, full_name: fullName, role: targetRole } = parsed.data;

    // Admin solo puede invitar agents
    if (currentRole === 'admin' && targetRole === 'admin') {
      return { error: 'No tienes permisos para invitar administradores', success: false };
    }

    const client = getClient();

    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return { error: 'Este email ya está registrado', success: false };
    }

    const { data: invitation, error: invError } = await client
      .from('invitations')
      .insert({
        company_id: companyId,
        email,
        full_name: fullName,
        role: targetRole,
      })
      .select()
      .single();

    if (invError) throw new Error(invError.message);

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const link = `${origin}/invite?token=${invitation.token}`;

    return { error: '', success: true, link };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
  }
}

export async function acceptInvitation(prevState: { error: string; success: boolean }, formData: FormData) {
  const parsed = AcceptInvitationSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
  }

  const { token, password } = parsed.data;

  try {
    const client = getClient();

    const { data: invitation, error: invError } = await client
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .single();

    if (invError || !invitation) {
      return { error: 'Invitación no válida o ya expiró', success: false };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          company_id: invitation.company_id,
          full_name: invitation.full_name,
          role: invitation.role,
        },
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Error al crear usuario');

    const { error: userError } = await client
      .from('users')
      .insert({
        id: authData.user.id,
        company_id: invitation.company_id,
        email: invitation.email,
        full_name: invitation.full_name,
        role: invitation.role,
      });

    if (userError) throw new Error(userError.message);

    await client
      .from('invitations')
      .update({ accepted: true })
      .eq('id', invitation.id);

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

export async function getCompanyById(companyId: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('companies')
      .select('id, name, slug')
      .eq('id', companyId)
      .single();

    if (error) return { company: null };
    return { company: data };
  } catch {
    return { company: null };
  }
}

export async function updateCompanyName(prevState: { error?: string; success?: boolean; name?: string }, formData: FormData) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role;
    if (role !== 'owner') return { error: 'Solo el dueño puede cambiar el nombre de la empresa' };

    const companyId = user.user_metadata?.company_id as string;
    const name = formData.get('name') as string;
    if (!name || name.trim().length < 2) return { error: 'El nombre debe tener al menos 2 caracteres' };

    const client = getClient();
    const { error } = await client
      .from('companies')
      .update({ name: name.trim() })
      .eq('id', companyId);

    if (error) return { error: error.message };
    return { success: true, name: name.trim() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function getAgents(companyId: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('company_id', companyId)
      .in('role', ['agent', 'admin'])
      .order('created_at', { ascending: false });

    if (error) return { agents: [] };
    return { agents: data };
  } catch {
    return { agents: [] };
  }
}

export async function getAgentResolvedCount(agentUserId: string) {
  try {
    const client = getClient();
    const { count, error } = await client
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', agentUserId)
      .in('status', ['RESOLVED', 'CLOSED']);

    if (error) return { count: 0 };
    return { count: count ?? 0 };
  } catch {
    return { count: 0 };
  }
}

export async function getAgentPendingCount(agentUserId: string) {
  try {
    const client = getClient();
    const { count, error } = await client
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', agentUserId)
      .in('status', ['OPEN', 'IN_PROGRESS', 'PENDING_TRIAGE']);

    if (error) return { count: 0 };
    return { count: count ?? 0 };
  } catch {
    return { count: 0 };
  }
}

export async function claimTicket(ticketId: string) {
  try {
    const user = await requireUser();
    const userId = user.id;
    const role = user.user_metadata?.role;
    if (role !== 'agent') return { error: 'Solo los agentes pueden tomar tickets', success: false };

    const client = getClient();

    const { data: ticket } = await client
      .from('tickets')
      .select('status, assigned_to')
      .eq('id', ticketId)
      .single();

    if (!ticket) return { error: 'Ticket no encontrado', success: false };
    if (ticket.status !== 'OPEN') return { error: 'Este ticket no está disponible para tomar', success: false };
    if (ticket.assigned_to) return { error: 'Este ticket ya está asignado a otro agente', success: false };

    const { error } = await client
      .from('tickets')
      .update({
        status: 'IN_PROGRESS',
        assigned_to: userId,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) return { error: error.message, success: false };
    return { success: true, error: '' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido', success: false };
  }
}

export async function getCompanyAgents(companyId: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('id, email, full_name, role')
      .eq('company_id', companyId)
      .eq('role', 'agent')
      .order('full_name', { ascending: true });

    if (error) return { agents: [] };
    return { agents: data || [] };
  } catch {
    return { agents: [] };
  }
}

export async function getTickets(
  companyId: string,
  filters?: { priority?: string; status?: string; from?: string; to?: string; assigned_to?: string },
  options?: { limit?: number; offset?: number }
) {
  try {
    const client = getClient();

    let query = client
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    if (filters?.priority) {
      query = query.eq('priority', parseInt(filters.priority));
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assigned_to) {
      if (filters.assigned_to === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', filters.assigned_to);
      }
    }

    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }

    if (filters?.to) {
      query = query.lte('created_at', filters.to);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener tickets:', error);
      return { error: error.message, tickets: [], count: 0 };
    }

    return { tickets: data, count: count ?? data.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al obtener tickets:', message);
    return { error: message, tickets: [], count: 0 };
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

    let agentName: string | null = null;
    if (data.assigned_to) {
      const { data: agentUser } = await client
        .from('users')
        .select('full_name, email')
        .eq('id', data.assigned_to)
        .single();
      if (agentUser) {
        agentName = agentUser.full_name || agentUser.email?.split('@')[0] || null;
      }
    }

    const { data: replies, error: repliesError } = await client
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    return { ticket: { ...data, resolved_by_name: agentName }, replies: replies || [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al obtener ticket:', message);
    return { error: message };
  }
}

export async function sendReply(prevState: ReplyState, formData: FormData) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const parsed = SendReplySchema.safeParse({
      ticket_id: formData.get('ticket_id'),
      body: formData.get('body'),
      author_name: formData.get('author_name'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
    }

    const { ticket_id: ticketId, body, author_name: authorName } = parsed.data;
    const agentName = authorName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agente';

    const client = getClient();

    const { data: ticket } = await client
      .from('tickets')
      .select('status, assigned_to')
      .eq('id', ticketId)
      .single();

    if (!ticket) return { error: 'Ticket no encontrado', success: false };
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return { error: 'Este ticket ya está resuelto o cerrado', success: false };
    }
    if (ticket.status === 'IN_PROGRESS' && ticket.assigned_to && ticket.assigned_to !== userId) {
      return { error: 'Este ticket está siendo atendido por otro agente', success: false };
    }

    const { error: replyError } = await client
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        author_type: 'agent',
        author_name: agentName,
        body,
      });

    if (replyError) {
      return { error: replyError.message, success: false };
    }

    await client
      .from('tickets')
      .update({
        status: 'RESOLVED',
        resolution: body,
        assigned_to: userId,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    return { success: true, error: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
  }
}
