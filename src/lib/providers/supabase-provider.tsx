'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClientComponentClient<Database>());
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
      
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }

      if (session?.access_token !== undefined) {
        try {
          // Set the auth cookie when the session changes
          const response = await fetch('/api/auth/cookie', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to set auth cookie');
          }
        } catch (error) {
          console.error('Error setting auth cookie:', error);
          // Only show error toast if it's not a network error (which might be due to page navigation)
          if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
            toast({
              title: 'Authentication Error',
              description: 'Please try refreshing the page.',
              variant: 'destructive',
            });
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, toast]);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
}; 