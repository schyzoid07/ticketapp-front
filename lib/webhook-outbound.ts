'use server';

import { supabaseAdmin } from '@/lib/supabase';

interface WebhookPayload {
  event: 'ticket.resolved';
  company: string;
  ticket: {
    id: string;
    title: string;
    user_name: string | null;
    user_email: string | null;
  };
  reply: {
    body: string;
    author_name: string;
  };
  resolved_at: string;
}

export async function fireOutboundWebhook(
  companyId: string,
  payload: WebhookPayload,
): Promise<void> {
  try {
    const client = supabaseAdmin;
    if (!client) return;

    const { data: company } = await client
      .from('companies')
      .select('webhook_url, name')
      .eq('id', companyId)
      .single();

    if (!company?.webhook_url) return;

    const fullPayload = { ...payload, company: company.name };

    fetch(company.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    }).catch((err) => {
      console.error(`Error al enviar webhook a ${company.webhook_url}:`, err);
    });
  } catch (err) {
    console.error('Error en fireOutboundWebhook:', err);
  }
}
