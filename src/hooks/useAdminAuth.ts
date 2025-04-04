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
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          throw error || new Error('No user found');
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
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setUser(null);
        setIsAdmin(false);
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        router.push('/admin/login');
      }
    };

    checkUser();
  }, [router, supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    isAdmin,
    role,
    permissions,
    isLoading,
    signOut,
  };
} 