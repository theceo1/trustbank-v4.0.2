'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User, Session } from '@supabase/auth-helpers-nextjs';
import { checkAndRefreshSession, validateSession, handleAuthError } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession: Session | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const supabase = createClientComponentClient();

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // If refresh fails, sign out the user
      await signOut();
    }
  };

  useEffect(() => {
    if (initialSession) {
      setUser(initialSession.user);
      setSession(initialSession);
      setLoading(false);
    } else {
      const checkUser = async () => {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (currentSession) {
            // Validate and refresh session if needed
            const refreshedSession = await checkAndRefreshSession(currentSession);
            if (refreshedSession && validateSession(refreshedSession)) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
            } else {
              // Invalid or expired session
              await signOut();
            }
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          const { type, message } = handleAuthError(error);
          if (type === 'expired') {
            await signOut();
          }
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      };

      checkUser();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, initialSession]);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 