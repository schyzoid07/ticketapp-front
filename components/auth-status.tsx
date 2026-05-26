'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, LogIn, Shield, Wrench, Crown } from 'lucide-react';
import type { AuthUser } from '@/lib/types';
import { createClient } from '@/lib/supabase-client';

export function AuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as unknown as AuthUser | null);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  if (loading) return null;

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted hover:text-gray-800"
      >
        <LogIn className="h-4 w-4" />
        Login
      </a>
    );
  }

  const role = user.user_metadata?.role || 'agent';
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  const roleMeta: Record<string, { icon: typeof Shield; label: string; color: string }> = {
    owner: { icon: Crown, label: 'Dueño', color: 'text-amber-600 bg-amber-100' },
    admin: { icon: Shield, label: 'Admin', color: 'text-indigo-600 bg-indigo-100' },
    agent: { icon: Wrench, label: 'Agente', color: 'text-purple-600 bg-purple-100' },
  };

  const meta = roleMeta[role] || roleMeta.agent;
  const RoleIcon = meta.icon;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 md:flex">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${meta.color}`}>
          <RoleIcon className="h-3.5 w-3.5" />
        </div>
        <div className="leading-tight">
          <p className="text-xs font-medium text-foreground">{fullName}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">{meta.label}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-muted hover:text-red-500"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
