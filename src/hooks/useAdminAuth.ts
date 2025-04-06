'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Permission } from '@/lib/rbac';

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setUser(null);
          setIsAdmin(false);
          return;
        }

        // Get the user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw userError || new Error('No user found');
        }

        // Check admin status using admin_users table
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select(`
            admin_roles (
              name,
              permissions
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (adminError) {
          console.error('Admin check error:', adminError);
          throw new Error('Not authorized');
        }

        if (!adminData?.admin_roles) {
          throw new Error('Not an admin user');
        }

        setUser(user);
        setRole(adminData.admin_roles.name);
        setPermissions(adminData.admin_roles.permissions || []);
        setIsAdmin(true);
        setError(null);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setUser(null);
        setIsAdmin(false);
        setRole(null);
        setPermissions([]);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Only redirect to login if we're not already there
        if (window.location.pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setRole(null);
        setPermissions([]);
        if (window.location.pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkUser();
      }
    });

    // Initial check
    checkUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setRole(null);
      setPermissions([]);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAdmin,
    role,
    permissions,
    isLoading,
    error,
    signOut,
  };
} 