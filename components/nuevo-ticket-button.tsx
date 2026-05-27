'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

export function NuevoTicketButton() {
  const [href, setHref] = useState('/');
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (user?.user_metadata?.company_id) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && anonKey) {
          const { createClient: cc } = await import('@supabase/supabase-js');
          const client = cc(supabaseUrl, anonKey);
          const { data: company } = await client
            .from('companies')
            .select('slug')
            .eq('id', user.user_metadata.company_id)
            .single();
          if (company?.slug) {
            setHref(`/${company.slug}`);
          }
        }
      }
    });
  }, []);

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-md"
    >
      <Plus className="h-4 w-4" />
      Nuevo ticket
    </a>
  );
}
