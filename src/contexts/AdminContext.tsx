'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Permission } from '@/lib/rbac';

interface AdminContextType {
  user: User | null;
  isAdmin: boolean;
  role: string | null;
  permissions: Permission[];
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const adminAuth = useAdminAuth();

  return (
    <AdminContext.Provider value={adminAuth}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 