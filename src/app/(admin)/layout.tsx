'use client'

import React, { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/admin/Sidebar';
import { usePermissions } from '@/hooks/usePermissions';
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isAdmin, loading } = usePermissions();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!loading) {
        if (!user || !session) {
          router.replace('/auth/login?redirect=/admin');
          return;
        }

        if (!isAdmin) {
          router.replace('/admin/login');
          return;
        }

        try {
          const response = await fetch('/api/admin/auth/check');
          if (!response.ok) {
            router.replace('/admin/login');
          }
        } catch (error) {
          console.error('[ADMIN LAYOUT] Error checking admin status:', error);
          router.replace('/admin/login');
        }
      }
    };

    checkAdminAccess();
  }, [user, session, isAdmin, loading, router]);

  // Show loading state while checking permissions
  if (loading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render admin layout if user is authenticated and has admin permissions
  if (user && session && isAdmin) {
  return (
      <div className="flex h-screen overflow-hidden bg-background dark:bg-zinc-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
              <NotificationWrapper />
            {children}
          </div>
        </main>
    </div>
  );
  }

  return null;
} 