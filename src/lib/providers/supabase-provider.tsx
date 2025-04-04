'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { toast } from 'sonner';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Clear any existing timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Debounce the cookie setting with a longer timeout
        timeoutId = setTimeout(async () => {
          try {
            // Set the auth cookie
            const response = await fetch('/api/auth/cookie', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              // Add retry logic
              signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (!response.ok) {
              if (response.status === 429) {
                // If rate limited, try again after a delay
                setTimeout(async () => {
                  const retryResponse = await fetch('/api/auth/cookie', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                  });
                  if (!retryResponse.ok) {
                    throw new Error('Failed to set auth cookie after retry');
                  }
                }, 2000); // Wait 2 seconds before retry
                return;
              }
              throw new Error('Failed to set auth cookie');
            }

            setUser(session.user);
            router.refresh();
          } catch (error) {
            console.error('Error setting auth cookie:', error);
            toast.error('Session sync failed. Please try signing in again.');
          }
        }, 2000); // Increase debounce to 2 seconds
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  return (
    <Context.Provider value={{ supabase, user }}>
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