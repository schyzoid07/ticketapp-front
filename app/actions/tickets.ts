'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase-server';
import { fireOutboundWebhook } from '@/lib/webhook-outbound';
import { sendEmail, buildTicketResolvedEmail } from '@/lib/email';
import type { TicketData, ReplyState, TokenUsage, DailyTokenUsage, CompanyTokenUsageReport, AgentUser } from '@/lib/types';
import {
  CreateTicketSchema,
  RegisterCompanySchema,
  AcceptInvitationSchema,
  CreateInvitationSchema,
  SendReplySchema,
  TicketDataSchema,
  ChangePasswordSchema,
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
    user_id: formData.get('user_id') ?? undefined,
    user_name: formData.get('user_name'),
    email: formData.get('email') ?? undefined,
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

    // Fire backend AI processing (fire-and-forget)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (backendUrl && webhookSecret) {
      fetch(`${backendUrl}/api/webhooks/process-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify({
          type: 'INSERT',
          table: 'tickets',
          record: data,
        }),
      }).catch((err) => console.error('Error al procesar ticket con IA:', err));
    }

    return { ticket: validated.data, error: '', rateLimit: { remaining: rateCheck.remaining, resetMinutes: rateCheck.resetMinutes } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al crear ticket:', message);

    if (message.includes('Failed to fetch') || message.includes('fetch') || message.includes('NetworkError') || message.includes('net::')) {
      return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.', ticket: null };
    }
    if (message.includes('Invalid API key') || message.includes('API key')) {
      return { error: 'Error de configuración del servidor. Contacta al administrador.', ticket: null };
    }

    return { error: message, ticket: null };
  }
}

export async function setTicketAIMode(ticketId: string, mode: 'minimal' | 'complete') {
  try {
    const user = await requireUser();
    requireRole(user, 'owner', 'admin');
    const companyId = user.user_metadata?.company_id;
    const userRole = user.user_metadata?.role as string;
    if (!companyId) return { error: 'Usuario sin empresa asignada' };

    const client = getClient();

    // Verificar plan si intenta cambiar a complete
    if (mode === 'complete') {
      const { data: company } = await client
        .from('companies')
        .select('plan')
        .eq('id', companyId)
        .single();

      if (company?.plan === 'basic') {
        if (userRole === 'owner') {
          return { error: 'plan_restricted_owner' };
        }
        return { error: 'plan_restricted_admin' };
      }
    }

    const { error } = await client
      .from('tickets')
      .update({ ai_mode: mode, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('company_id', companyId);

    if (error) return { error: error.message };

    // If switching to complete, trigger reprocess on backend with JWT
    if (mode === 'complete') {
      const supabase = await createServerSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return { error: 'Sesión no encontrada' };

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

      try {
        await fetch(`${backendUrl}/api/tickets/reprocess`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ticket_id: ticketId }),
          signal: AbortSignal.timeout(60000),
        });
      } catch (fetchErr) {
        console.error('Error al reprocesar ticket:', fetchErr);
        return { error: 'Modo actualizado pero hubo un error al reprocesar con IA completa. Intenta de nuevo.' };
      }
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/tickets/${ticketId}`);

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function setTicketPriority(ticketId: string, priority: number) {
  try {
    const user = await requireUser();
    requireRole(user, 'owner', 'admin');
    const companyId = user.user_metadata?.company_id;
    if (!companyId) return { error: 'Usuario sin empresa asignada' };

    const client = getClient();
    const { error } = await client
      .from('tickets')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('company_id', companyId);

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
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('net::')) {
      return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.', success: false };
    }
    if (message.includes('Email already registered') || message.includes('already registered')) {
      return { error: 'Este correo electrónico ya está registrado. Inicia sesión o usa otro correo.', success: false };
    }
    return { error: message, success: false };
  }
}

export async function createInvitation(prevState: { error: string; success: boolean; link?: string }, formData: FormData) {
  try {
    const user = await requireUser();
    const currentRole = user.user_metadata?.role;
    requireRole(user, 'owner', 'admin');

    const companyId = user.user_metadata?.company_id;
    if (!companyId) return { error: 'Usuario sin empresa asignada', success: false };

    const parsed = CreateInvitationSchema.safeParse({
      email: formData.get('email'),
      full_name: formData.get('full_name'),
      role: formData.get('role'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
    }

    const { email, full_name: fullName, role: targetRole } = parsed.data;

    // Admin solo puede invitar agents
    if (currentRole === 'admin' && targetRole === 'admin') {
      return { error: 'No tienes permisos para invitar administradores', success: false };
    }

    const client = getClient();

    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('company_id', companyId)
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
      .select('id, name, slug, webhook_url, plan, weekly_report, alerts')
      .eq('id', companyId)
      .single();

    if (error) return { company: null };
    return { company: data };
  } catch {
    return { company: null };
  }
}

export async function getCompanyPlan(companyId: string) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role as string;
    if (role !== 'owner' && role !== 'admin') {
      return { plan: null, error: 'No autorizado' };
    }

    const client = getClient();
    const { data, error } = await client
      .from('companies')
      .select('id, name, plan')
      .eq('id', companyId)
      .single();

    if (error) return { plan: null, error: error.message };
    return { plan: data as { id: string; name: string; plan: string } };
  } catch (err) {
    return { plan: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function updateCompanyName(formData: FormData) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role;
    if (role !== 'owner') throw new Error('Solo el dueño puede cambiar el nombre de la empresa');

    const companyId = user.user_metadata?.company_id as string;
    const name = formData.get('name') as string;
    if (!name || name.trim().length < 2) throw new Error('El nombre debe tener al menos 2 caracteres');

    const client = getClient();
    const { error } = await client
      .from('companies')
      .update({ name: name.trim() })
      .eq('id', companyId);

    if (error) throw new Error(error.message);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/profile');
  } catch (err) {
    console.error('Error al actualizar nombre:', err);
    const { redirect } = await import('next/navigation');
    redirect(`/profile?error=${encodeURIComponent(err instanceof Error ? err.message : 'Error desconocido')}`);
  }
}

export async function updateCompanyWebhook(formData: FormData) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role;
    if (role !== 'owner') throw new Error('Solo el dueño puede configurar el webhook');

    const companyId = user.user_metadata?.company_id as string;
    const webhookUrl = formData.get('webhook_url') as string;

    const client = getClient();
    const { error } = await client
      .from('companies')
      .update({ webhook_url: webhookUrl?.trim() || null })
      .eq('id', companyId);

    if (error) throw new Error(error.message);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/profile');
  } catch (err) {
    console.error('Error al actualizar webhook:', err);
    const { redirect } = await import('next/navigation');
    redirect(`/profile?error=${encodeURIComponent(err instanceof Error ? err.message : 'Error desconocido')}`);
  }
}

export async function saveWeeklyReportConfig(formData: FormData) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role;
    if (role !== 'owner') throw new Error('Solo el dueño puede configurar el reporte semanal');

    const companyId = user.user_metadata?.company_id as string;
    const enabled = formData.get('enabled') === 'on';
    const recipientsRaw = formData.get('recipients') as string;

    const recipients = recipientsRaw
      .split(/[\n,]+/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const client = getClient();
    const { error } = await client
      .from('companies')
      .update({ weekly_report: { enabled, recipients } })
      .eq('id', companyId);

    if (error) throw new Error(error.message);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/profile');
  } catch (err) {
    console.error('Error al guardar config de reporte:', err);
    const { redirect } = await import('next/navigation');
    redirect(`/profile?error=${encodeURIComponent(err instanceof Error ? err.message : 'Error desconocido')}`);
  }
}

export async function saveAlertsConfig(formData: FormData) {
  try {
    const user = await requireUser();
    const role = user.user_metadata?.role;
    if (role !== 'owner') throw new Error('Solo el dueño puede configurar alertas');

    const companyId = user.user_metadata?.company_id as string;
    const emailEnabled = formData.get('email_enabled') === 'on';
    const emailRecipientsRaw = formData.get('email_recipients') as string;
    const telegramToken = (formData.get('telegram_token') as string) || '';
    const telegramChatId = (formData.get('telegram_chat_id') as string) || '';

    const emailRecipients = emailRecipientsRaw
      .split(/[\n,]+/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const client = getClient();
    const { error } = await client
      .from('companies')
      .update({
        alerts: {
          email_enabled: emailEnabled,
          email_recipients: emailRecipients,
          telegram_token: telegramToken || null,
          telegram_chat_id: telegramChatId || null,
        },
      })
      .eq('id', companyId);

    if (error) throw new Error(error.message);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/profile');
  } catch (err) {
    console.error('Error al guardar alertas:', err);
    const { redirect } = await import('next/navigation');
    redirect(`/profile?error=${encodeURIComponent(err instanceof Error ? err.message : 'Error desconocido')}`);
  }
}

export async function reprocessTicket(ticketId: string) {
  try {
    const user = await requireUser();
    const companyId = user.user_metadata?.company_id;
    if (!companyId) return { error: 'Usuario sin empresa asignada' };

    const client = getClient();

    const { data: ticket } = await client
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('company_id', companyId)
      .single();

    if (!ticket) return { error: 'Ticket no encontrado' };
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return { error: 'No se puede re-analizar un ticket resuelto o cerrado' };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) return { error: 'Webhook secret no configurado' };

    const response = await fetch(`${backendUrl}/api/webhooks/process-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify({ type: 'INSERT', table: 'tickets', record: ticket }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      return { error: `Error al re-analizar: ${text}` };
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/tickets/${ticketId}`);

    return { success: true, error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function getAgents(companyId: string) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('id, email, full_name, role, created_at, blocked')
      .eq('company_id', companyId)
      .in('role', ['agent', 'admin'])
      .order('created_at', { ascending: false });

    if (error) return { agents: [] };
    return { agents: data as AgentUser[] };
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
    const userCompanyId = user.user_metadata?.company_id;
    if (role !== 'agent') return { error: 'Solo los agentes pueden tomar tickets', success: false };

    const isBlocked = await checkUserBlocked(userId);
    if (isBlocked) return { error: 'Su usuario ha sido bloqueado. No puede tomar tickets.', success: false };

    const client = getClient();

    const { data: ticket } = await client
      .from('tickets')
      .select('status, assigned_to, company_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) return { error: 'Ticket no encontrado', success: false };
    if (ticket.company_id !== userCompanyId) return { error: 'No tienes permiso para tomar este ticket', success: false };
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

export async function checkUserBlocked(userId: string): Promise<boolean> {
  try {
    const client = getClient();
    const { data } = await client
      .from('users')
      .select('blocked')
      .eq('id', userId)
      .single();
    return data?.blocked === true;
  } catch {
    return false;
  }
}

export async function toggleAgentBlock(agentUserId: string) {
  try {
    const user = await requireUser();
    requireRole(user, 'owner', 'admin');
    const companyId = user.user_metadata?.company_id;
    if (!companyId) return { error: 'Usuario sin empresa asignada' };

    const client = getClient();

    const { data: targetUser } = await client
      .from('users')
      .select('company_id, blocked, role')
      .eq('id', agentUserId)
      .single();

    if (!targetUser) return { error: 'Usuario no encontrado' };
    if (targetUser.company_id !== companyId) return { error: 'No tienes permiso para modificar este usuario' };
    if (targetUser.role === 'owner') return { error: 'No se puede bloquear al dueño de la empresa' };

    const newBlocked = !targetUser.blocked;
    const { error } = await client
      .from('users')
      .update({ blocked: newBlocked })
      .eq('id', agentUserId);

    if (error) return { error: error.message };

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/agents');

    return { success: true, blocked: newBlocked, error: '' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function changePassword(prevState: { error: string; success: boolean }, formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado', success: false };

    const parsed = ChangePasswordSchema.safeParse({
      current_password: formData.get('current_password'),
      new_password: formData.get('new_password'),
      confirm_password: formData.get('confirm_password'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false };
    }

    // Verify current password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: parsed.data.current_password,
    });

    if (signInError) {
      return { error: 'La contraseña actual no es correcta', success: false };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    });

    if (updateError) {
      return { error: updateError.message, success: false };
    }

    return { error: '', success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { error: message, success: false };
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

export async function getCompanyTags(companyId: string) {
  try {
    const client = getClient();
    const { data } = await client
      .from('tickets')
      .select('tags')
      .eq('company_id', companyId)
      .not('tags', 'is', null);

    if (!data) return { tags: [] };
    const uniqueTags = [...new Set(data.flatMap((t) => t.tags as string[] || []))].sort();
    return { tags: uniqueTags };
  } catch {
    return { tags: [] };
  }
}

function getMonthRange(offset: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function sumTokens(usage: { promptTokens: number; candidatesTokens: number; totalTokens: number } | undefined, accum: { promptTokens: number; candidatesTokens: number; totalTokens: number }) {
  if (!usage) return;
  accum.promptTokens += usage.promptTokens;
  accum.candidatesTokens += usage.candidatesTokens;
  accum.totalTokens += usage.totalTokens;
}

export async function getCompanyTokenUsage(companyId: string): Promise<{ report: CompanyTokenUsageReport | null; error?: string }> {
  try {
    const user = await requireUser();
    requireRole(user, 'owner', 'admin');

    const client = getClient();

    const { start: cmStart, end: cmEnd } = getMonthRange(0);
    const { start: pmStart, end: pmEnd } = getMonthRange(-1);

    // Get company plan for token limits
    const { data: company } = await client
      .from('companies')
      .select('plan')
      .eq('id', companyId)
      .single();

    const companyPlan = (company?.plan as string) || 'basic';
    const PLAN_LIMITS: Record<string, number> = { basic: 10_000, complete: 100_000 };
    const planLimit = PLAN_LIMITS[companyPlan] || 10_000;

    const { data: tickets, error } = await client
      .from('tickets')
      .select('id, title, created_at, ai_token_usage')
      .eq('company_id', companyId)
      .gte('created_at', pmStart)
      .not('ai_token_usage', 'is', null);

    if (error) return { report: null, error: error.message };

    const currentMonthTickets = tickets?.filter((t) => t.created_at >= cmStart && t.created_at <= cmEnd) || [];
    const previousMonthTickets = tickets?.filter((t) => t.created_at >= pmStart && t.created_at <= pmEnd) || [];

    // Aggregate current month
    const total = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };
    const triage = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };
    const context = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };
    const response = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };
    const dailyMap = new Map<string, { totalTokens: number; ticketCount: number }>();

    for (const t of currentMonthTickets) {
      const u = t.ai_token_usage as TokenUsage | null;
      if (!u) continue;
      sumTokens(u.total, total);
      sumTokens(u.triage, triage);
      sumTokens(u.context, context);
      sumTokens(u.response, response);

      const day = t.created_at.slice(0, 10);
      const entry = dailyMap.get(day) || { totalTokens: 0, ticketCount: 0 };
      entry.totalTokens += u.total.totalTokens;
      entry.ticketCount += 1;
      dailyMap.set(day, entry);
    }

    // Fill missing days with zero
    const cmStartDate = new Date(cmStart);
    const cmEndDate = new Date(cmEnd);
    const dailyUsage: DailyTokenUsage[] = [];
    for (let d = new Date(cmStartDate); d <= cmEndDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      dailyUsage.push({
        date: key,
        totalTokens: entry?.totalTokens ?? 0,
        ticketCount: entry?.ticketCount ?? 0,
      });
    }

    // Previous month totals
    let previousMonthTotal = 0;
    for (const t of previousMonthTickets) {
      const u = t.ai_token_usage as TokenUsage | null;
      if (u?.total?.totalTokens) previousMonthTotal += u.total.totalTokens;
    }

    // Recent tickets with AI
    const recentTickets = currentMonthTickets
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((t) => {
        const u = t.ai_token_usage as TokenUsage | null;
        return {
          id: t.id,
          title: t.title,
          created_at: t.created_at,
          totalTokens: u?.total?.totalTokens ?? 0,
        };
      });

    const planNames: Record<string, string> = { basic: 'Básico', complete: 'Completo' };

    const report: CompanyTokenUsageReport = {
      currentMonth: {
        total: { promptTokens: total.promptTokens, candidatesTokens: total.candidatesTokens, totalTokens: total.totalTokens },
        triage: { promptTokens: triage.promptTokens, candidatesTokens: triage.candidatesTokens, totalTokens: triage.totalTokens },
        context: { promptTokens: context.promptTokens, candidatesTokens: context.candidatesTokens, totalTokens: context.totalTokens },
        response: { promptTokens: response.promptTokens, candidatesTokens: response.candidatesTokens, totalTokens: response.totalTokens },
        ticketCount: currentMonthTickets.length,
      },
      previousMonthTotal,
      previousMonthTicketCount: previousMonthTickets.length,
      dailyUsage,
      planLimit,
      planName: planNames[companyPlan] || 'Básico',
      recentTickets,
    };

    return { report };
  } catch (err) {
    return { report: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function getTickets(
  companyId: string,
  filters?: { priority?: string; status?: string; from?: string; to?: string; assigned_to?: string; tag?: string },
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

    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
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
    const user = await requireUser();
    const companyId = user.user_metadata?.company_id;
    if (!companyId) return { error: 'Usuario sin empresa asignada', replies: [] };

    const client = getClient();

    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
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

    if (user.user_metadata?.role === 'agent') {
      const isBlocked = await checkUserBlocked(userId);
      if (isBlocked) return { error: 'Su usuario ha sido bloqueado. No puede responder tickets.', success: false };
    }

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
    const userCompanyId = user.user_metadata?.company_id;

    const { data: ticket } = await client
      .from('tickets')
      .select('status, assigned_to, company_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) return { error: 'Ticket no encontrado', success: false };
    if (ticket.company_id !== userCompanyId) return { error: 'No tienes permiso para responder este ticket', success: false };
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

    // Fire outbound webhook (fire-and-forget)
    const { data: ticketWithCompany } = await client
      .from('tickets')
      .select('company_id, title, user_name, email')
      .eq('id', ticketId)
      .single();

    if (ticketWithCompany) {
      fireOutboundWebhook(ticketWithCompany.company_id, {
        event: 'ticket.resolved',
        company: '',
        ticket: {
          id: ticketId,
          title: ticketWithCompany.title,
          user_name: ticketWithCompany.user_name,
          user_email: ticketWithCompany.email,
        },
        reply: {
          body,
          author_name: agentName,
        },
        resolved_at: new Date().toISOString(),
      });

      // Send email to customer (fire-and-forget via Resend)
      if (ticketWithCompany.email) {
        const companyName = ticketWithCompany.company_id
          ? (await client.from('companies').select('name').eq('id', ticketWithCompany.company_id).single()).data?.name
          : null;

        const { subject, html } = buildTicketResolvedEmail({
          user_name: ticketWithCompany.user_name,
          ticket_title: ticketWithCompany.title,
          reply_body: body,
          agent_name: agentName,
          company_name: companyName,
        });

        await sendEmail({ to: ticketWithCompany.email, subject, html });
      }

      // Fire internal n8n webhook (todas las resoluciones, sin importar la empresa)
      const n8nUrl = process.env.INTERNAL_WEBHOOK_URL;
      if (n8nUrl) {
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ticket.resolved',
            company_id: ticketWithCompany.company_id,
            ticket: {
              id: ticketId,
              title: ticketWithCompany.title,
              user_name: ticketWithCompany.user_name,
              user_email: ticketWithCompany.email,
            },
            reply: { body, author_name: agentName },
            resolved_at: new Date().toISOString(),
          }),
        }).catch((err) => console.error('Error al enviar a n8n:', err));
      }
    }

    return { success: true, error: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('net::')) {
      return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.', success: false };
    }
    return { error: message, success: false };
  }
}
