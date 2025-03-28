'use client'

import React, { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { usePermissions } from '@/hooks/usePermissions';
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAdmin, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (!loading && !permissionsLoading) {
      if (!user || !isAdmin()) {
        router.push('/auth/login');
      }
    }
  }, [user, loading, permissionsLoading, router, isAdmin]);

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="border-b p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <NotificationWrapper />
              {/* Other header items */}
            </div>
          </div>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 