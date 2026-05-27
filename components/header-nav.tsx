'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, User } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

export function HeaderNav() {
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.user_metadata?.role;
      setShowTeam(role === 'owner' || role === 'admin');
    });
  }, []);

  return (
    <>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted hover:text-gray-800"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </a>
      <a
        href="/profile"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted hover:text-gray-800"
      >
        <User className="h-4 w-4" />
        Perfil
      </a>
      {showTeam && (
        <a
          href="/admin/agents"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted hover:text-gray-800"
        >
          <Users className="h-4 w-4" />
          Equipo
        </a>
      )}
    </>
  );
}
