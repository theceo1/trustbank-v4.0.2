import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import type { User } from '@supabase/auth-helpers-nextjs';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Don't show welcome toast on initial session
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing session:', error);
        if (mounted) {
          setUser(null);
          setIsInitialized(true);
        }
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', { event, session });

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            setUser(session.user);
            // Wait for state update before navigation
            setTimeout(async () => {
              await router.refresh();
              router.push('/dashboard');
              toast({
                title: "Welcome back! 👋",
                description: "You have successfully signed in.",
                className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              });
            }, 0);
          }
          break;
        case 'SIGNED_OUT':
          setUser(null);
          await router.refresh();
          router.push('/');
          break;
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user);
            await router.refresh();
          }
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return { user, isInitialized };
} 