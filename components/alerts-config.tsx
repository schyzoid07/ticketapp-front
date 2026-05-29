'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, Send, Save, Loader2, ExternalLink } from 'lucide-react';

interface Props {
  config: {
    email_enabled?: boolean;
    email_recipients?: string[];
    telegram_token?: string | null;
    telegram_chat_id?: string | null;
  } | null;
}

export function AlertsConfig({ config }: Props) {
  const router = useRouter();
  const [emailEnabled, setEmailEnabled] = useState(config?.email_enabled ?? false);
  const [emailRecipients, setEmailRecipients] = useState((config?.email_recipients ?? []).join('\n'));
  const [telegramEnabled, setTelegramEnabled] = useState(!!(config?.telegram_token && config?.telegram_chat_id));
  const [telegramToken, setTelegramToken] = useState(config?.telegram_token || '');
  const [telegramChatId, setTelegramChatId] = useState(config?.telegram_chat_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const form = new FormData();
    if (emailEnabled) form.set('email_enabled', 'on');
    form.set('email_recipients', emailRecipients);
    if (telegramEnabled) {
      form.set('telegram_token', telegramToken);
      form.set('telegram_chat_id', telegramChatId);
    }

    try {
      const res = await fetch('/profile', {
        method: 'POST',
        body: form,
      });

      const url = new URL(res.url || '/profile', window.location.origin);
      const errParam = url.searchParams.get('error');
      if (errParam) {
        setError(decodeURIComponent(errParam));
        setSaving(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
        <Bell className="h-3.5 w-3.5" />
        Alertas en tiempo real
      </h2>
      <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <p className="mb-3 text-xs leading-relaxed text-amber-700/70">
          Recibe una notificación inmediata cuando llegue un ticket de prioridad <strong>Crítica (4)</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="rounded-xl border border-white/60 bg-white/40 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 text-amber-500" />
                Correo electrónico
              </span>
              <button
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailEnabled ? 'bg-amber-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={emailEnabled}
              >
                <span className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {emailEnabled && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-gray-500">
                  Destinatarios (uno por línea o separados por coma)
                </label>
                <textarea
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  rows={2}
                  placeholder="admin@miempresa.com&#10;soporte@miempresa.com"
                  className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}
          </div>

          {/* Telegram */}
          <div className="rounded-xl border border-white/60 bg-white/40 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Send className="h-4 w-4 text-amber-500" />
                Telegram
              </span>
              <button
                type="button"
                onClick={() => setTelegramEnabled(!telegramEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  telegramEnabled ? 'bg-amber-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={telegramEnabled}
              >
                <span className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${telegramEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {telegramEnabled && (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-amber-100/50 p-3 text-xs text-amber-800">
                  <p className="font-medium mb-1">¿Cómo crear un bot de Telegram?</p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700/80">
                    <li>Abre Telegram y busca <strong>@BotFather</strong></li>
                    <li>Envía <code className="bg-amber-200/50 px-1 rounded">/newbot</code> y sigue los pasos</li>
                    <li>Guarda el <strong>token</strong> que te da BotFather</li>
                    <li>Inicia el chat con tu bot y envíale <code className="bg-amber-200/50 px-1 rounded">/start</code></li>
                    <li>Visita <a href="#" onClick={(e) => { e.preventDefault(); navigator.clipboard?.writeText(`https://api.telegram.org/bot${telegramToken || 'TOKEN'}/getUpdates`); }} className="underline underline-offset-2 hover:text-amber-900">api.telegram.org/bot&lt;token&gt;/getUpdates</a> para obtener el <strong>Chat ID</strong></li>
                  </ol>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Token del bot</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="123456:ABCdef..."
                    className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="-123456789 o 123456789"
                    className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-emerald-600">Configuración guardada</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
