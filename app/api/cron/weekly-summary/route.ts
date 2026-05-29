import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET;

const priorityLabels: Record<number, string> = {
  0: 'Fuera de scope',
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
  4: 'Crítica',
};

const categoryLabels: Record<string, string> = {
  SOFTWARE_BUG: 'Bug de Software',
  BILLING: 'Facturación',
  ACCOUNT_ACCESS: 'Acceso a Cuenta',
  FEATURE_REQUEST: 'Sugerencia',
  GENERAL_INQUIRY: 'Consulta',
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildReportHtml(params: {
  companyName: string;
  weekStart: string;
  weekEnd: string;
  general: { total: number; resolved: number; open: number; pending: number; unassigned: number };
  byPriority: { priority: number; count: number }[];
  byCategory: { category: string; count: number }[];
  agents: { name: string; assigned: number; resolved: number }[];
  tokens: { ticketCount: number; totalTokens: number };
}): string {
  const { companyName, weekStart, weekEnd, general, byPriority, byCategory, agents, tokens } = params;

  const resolvedRate = general.total > 0 ? Math.round((general.resolved / general.total) * 100) : 0;
  const priorityRows = byPriority
    .map((p) => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px;">${priorityLabels[p.priority] || p.priority}</td><td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px; text-align: center; font-weight: 600;">${p.count}</td></tr>`)
    .join('');

  const categoryRows = byCategory
    .map((c) => `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px;">${categoryLabels[c.category] || c.category}</td><td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px; text-align: center; font-weight: 600;">${c.count}</td></tr>`)
    .join('');

  const agentRows = agents
    .map((a) => {
      const rate = a.assigned > 0 ? Math.round((a.resolved / a.assigned) * 100) : 0;
      return `<tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px;">${escapeHtml(a.name)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px; text-align: center;">${a.assigned}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px; text-align: center; font-weight: 600; color: ${rate >= 80 ? '#059669' : '#d97706'};">${a.resolved}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e5e4; font-size: 13px; text-align: center; color: ${rate >= 80 ? '#059669' : '#d97706'};">${rate}%</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f4; padding: 32px 16px; margin: 0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
  <tr>
    <td style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 4px 0; font-weight: 700;">Resumen Semanal</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">${escapeHtml(companyName)}</p>
      <p style="color: rgba(255,255,255,0.65); font-size: 11px; margin: 4px 0 0 0;">${weekStart} — ${weekEnd}</p>
    </td>
  </tr>

  <tr><td style="padding: 24px;">

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px;">
      <div style="background: #f5f5f4; border-radius: 8px; padding: 12px; text-align: center;">
        <p style="font-size: 22px; font-weight: 700; color: #292524; margin: 0;">${general.total}</p>
        <p style="font-size: 11px; color: #78716c; margin: 4px 0 0 0;">Creados</p>
      </div>
      <div style="background: #f5f5f4; border-radius: 8px; padding: 12px; text-align: center;">
        <p style="font-size: 22px; font-weight: 700; color: #059669; margin: 0;">${general.resolved}</p>
        <p style="font-size: 11px; color: #78716c; margin: 4px 0 0 0;">Resueltos</p>
      </div>
      <div style="background: #f5f5f4; border-radius: 8px; padding: 12px; text-align: center;">
        <p style="font-size: 22px; font-weight: 700; color: #d97706; margin: 0;">${general.open}</p>
        <p style="font-size: 11px; color: #78716c; margin: 4px 0 0 0;">En curso</p>
      </div>
      <div style="background: #f5f5f4; border-radius: 8px; padding: 12px; text-align: center;">
        <p style="font-size: 22px; font-weight: 700; color: #dc2626; margin: 0;">${general.unassigned}</p>
        <p style="font-size: 11px; color: #78716c; margin: 4px 0 0 0;">Sin asignar</p>
      </div>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 24px;">
      <p style="font-size: 14px; font-weight: 600; color: #166534; margin: 0;">Tasa de resolución: <span style="font-size: 18px;">${resolvedRate}%</span></p>
    </div>

    <h2 style="font-size: 13px; font-weight: 700; color: #44403c; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Rendimiento por agente</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f5f5f4;">
        <th style="padding: 8px 10px; font-size: 11px; color: #78716c; text-align: left; text-transform: uppercase; letter-spacing: 0.05em;">Agente</th>
        <th style="padding: 8px 10px; font-size: 11px; color: #78716c; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">Asignados</th>
        <th style="padding: 8px 10px; font-size: 11px; color: #78716c; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">Resueltos</th>
        <th style="padding: 8px 10px; font-size: 11px; color: #78716c; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">%</th>
      </tr>
      ${agentRows || '<tr><td colspan="4" style="padding: 12px; text-align: center; font-size: 13px; color: #a8a29e;">Sin actividad esta semana</td></tr>'}
    </table>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
      <div>
        <h2 style="font-size: 13px; font-weight: 700; color: #44403c; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Por prioridad</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${priorityRows || '<tr><td style="padding: 8px; text-align: center; font-size: 13px; color: #a8a29e;">Sin datos</td></tr>'}
        </table>
      </div>
      <div>
        <h2 style="font-size: 13px; font-weight: 700; color: #44403c; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Por categoría</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${categoryRows || '<tr><td style="padding: 8px; text-align: center; font-size: 13px; color: #a8a29e;">Sin datos</td></tr>'}
        </table>
      </div>
    </div>

    <div style="margin-top: 24px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
      <h2 style="font-size: 11px; font-weight: 700; color: #92400e; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">Tokens consumidos (Gemini)</h2>
      <p style="font-size: 18px; font-weight: 700; color: #92400e; margin: 0;">${tokens.totalTokens.toLocaleString()}</p>
      <p style="font-size: 11px; color: #b45309; margin: 2px 0 0 0;">en ${tokens.ticketCount} tickets procesados con IA</p>
    </div>

  </td></tr>

  <tr>
    <td style="background: #f5f5f4; padding: 16px 24px; text-align: center;">
      <p style="font-size: 11px; color: #a8a29e; margin: 0;">TicketSupport — Reporte generado automáticamente</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const weekEnd = new Date(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
    }

    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, weekly_report');

    if (companiesError) {
      console.error('Error al consultar empresas:', companiesError);
      return NextResponse.json({ error: companiesError.message }, { status: 500 });
    }

    const enabledCompanies = (companies || []).filter((c) => {
      const config = c.weekly_report as { enabled?: boolean; recipients?: string[] } | null;
      return config?.enabled === true && config?.recipients && config.recipients.length > 0;
    });

    console.log(`Reporte semanal: ${enabledCompanies.length} empresas habilitadas`);

    const results: { company: string; recipients: number; error?: string }[] = [];

    for (const company of enabledCompanies) {
      try {
        const config = company.weekly_report as { enabled?: boolean; recipients?: string[] };
        const recipients = config?.recipients || [];

        const { data: tickets } = await supabaseAdmin
          .from('tickets')
          .select('id, status, priority, category, assigned_to, ai_token_usage, created_at')
          .eq('company_id', company.id)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        const ticketList = tickets || [];

        const general = {
          total: ticketList.length,
          resolved: ticketList.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
          open: ticketList.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
          pending: ticketList.filter((t) => t.status === 'PENDING_TRIAGE').length,
          unassigned: ticketList.filter((t) => !t.assigned_to && t.status !== 'CLOSED').length,
        };

        const priorityMap = new Map<number, number>();
        const categoryMap = new Map<string, number>();
        let tokenCount = 0;
        let tokensTicketCount = 0;

        for (const t of ticketList) {
          if (t.priority !== null) {
            priorityMap.set(t.priority, (priorityMap.get(t.priority) || 0) + 1);
          }
          if (t.category) {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
          }
          if (t.ai_token_usage) {
            const usage = t.ai_token_usage as { total?: { totalTokens?: number } };
            if (usage?.total?.totalTokens) {
              tokenCount += usage.total.totalTokens;
              tokensTicketCount++;
            }
          }
        }

        const byPriority = [...priorityMap.entries()]
          .map(([priority, count]) => ({ priority, count }))
          .sort((a, b) => b.priority - a.priority);

        const byCategory = [...categoryMap.entries()]
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        const { data: agents } = await supabaseAdmin
          .from('users')
          .select('id, full_name')
          .eq('company_id', company.id)
          .eq('role', 'agent');

        const agentStats = (agents || []).map((a) => {
          const assigned = ticketList.filter((t) => t.assigned_to === a.id).length;
          const resolved = ticketList.filter((t) => t.assigned_to === a.id && (t.status === 'RESOLVED' || t.status === 'CLOSED')).length;
          return { name: a.full_name || 'Agente', assigned, resolved };
        }).sort((a, b) => b.resolved - a.resolved);

        const html = buildReportHtml({
          companyName: company.name,
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          general,
          byPriority,
          byCategory,
          agents: agentStats,
          tokens: { ticketCount: tokensTicketCount, totalTokens: tokenCount },
        });

        const subject = `Resumen Semanal — ${company.name} (${weekStartStr})`;

        for (const email of recipients) {
          await sendEmail({ to: email, subject, html }).catch((err) => {
            console.error(`Error enviando reporte a ${email}:`, err);
          });
        }

        results.push({ company: company.name, recipients: recipients.length });
      } catch (err) {
        console.error(`Error procesando empresa ${company.name}:`, err);
        results.push({ company: company.name, recipients: 0, error: 'Error interno' });
      }
    }

    return NextResponse.json({
      success: true,
      generated: now.toISOString(),
      week: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
      companies: results,
    });
  } catch (err) {
    console.error('Error en reporte semanal:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
