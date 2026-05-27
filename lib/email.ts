const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'TicketSupport';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada — omitiendo email');
    return;
  }

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  }).catch((err) => {
    console.error('Error al enviar email vía Resend:', err);
  });
}

export function buildTicketResolvedEmail(params: {
  user_name: string | null;
  ticket_title: string;
  reply_body: string;
  agent_name: string;
  company_name?: string | null;
}): { subject: string; html: string } {
  const salutation = params.user_name
    ? `Estimado/a ${params.user_name}`
    : 'Estimado/a cliente';

  const companyLine = params.company_name
    ? ` en nombre de <strong>${params.company_name}</strong>`
    : '';

  const subject = `Ticket resuelto: ${params.ticket_title}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f4; padding: 32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table style="max-width: 480px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 600;">Ticket resuelto</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="font-size: 14px; color: #292524; margin: 0 0 16px 0;">${salutation},</p>
              <p style="font-size: 14px; color: #292524; margin: 0 0 16px 0;">Su ticket ha sido resuelto por <strong>${params.agent_name}</strong>${companyLine}:</p>
              <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin: 0 0 16px 0;">
                <p style="font-size: 12px; color: #78716c; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">${params.ticket_title}</p>
                <p style="font-size: 14px; color: #292524; margin: 0; white-space: pre-wrap; line-height: 1.5;">${params.reply_body}</p>
              </div>
              <p style="font-size: 13px; color: #78716c; margin: 0;">Si tiene alguna duda, responda a este correo o contacte nuevamente a nuestro equipo de soporte.</p>
            </td>
          </tr>
          <tr>
            <td style="background: #f5f5f4; padding: 16px 24px; text-align: center;">
              <p style="font-size: 11px; color: #a8a29e; margin: 0;">TicketSupport — Sistema de Soporte Multi-Agente</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
