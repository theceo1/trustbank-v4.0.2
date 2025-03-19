'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession: User | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (initialSession) {
      setUser(initialSession);
      setLoading(false);
    } else {
      // Only check user if we don't have an initial session
      const checkUser = async () => {
        try {
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          if (error) {
            throw error;
          }
          setUser(currentUser);
        } catch (error) {
          console.error('Error checking auth status:', error);
          setUser(null);
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
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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