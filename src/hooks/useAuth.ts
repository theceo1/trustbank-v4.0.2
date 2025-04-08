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
            
            // Only check admin status if the URL includes /admin
            if (window.location.pathname.includes('/admin')) {
              try {
                const response = await fetch('/api/admin/auth/check');
                const data = await response.json();
                
                if (data.isAdmin) {
                  // Skip the default redirect for admin users
                  await router.refresh();
                  return;
                }
              } catch (error) {
                // If admin check fails, proceed with normal user flow
                console.error('Admin check error:', error);
              }
            }

            // Update router state immediately
            await router.refresh();
            
            // Only show welcome toast if not coming from signup
            if (!window.location.pathname.includes('/auth/signup')) {
              toast({
                title: "Welcome back! 👋",
                description: "You have successfully signed in.",
                className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              });
            }
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