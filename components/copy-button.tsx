'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 rounded-lg bg-white/60 px-3 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-white"
    >
      {copied ? (
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copiado
        </span>
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
