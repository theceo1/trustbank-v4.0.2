import React from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import SupabaseProvider from "@/lib/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { AdminProvider } from '@/contexts/AdminContext';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { Sidebar } from '@/components/admin/Sidebar';
import { redirect } from 'next/navigation';

interface AdminRole {
  name: string;
}

interface AdminData {
  admin_roles: AdminRole;
}

export const metadata = {
  title: 'Admin Dashboard - trustBank',
  description: 'trustBank Admin Dashboard',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current path from headers
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isLoginPage = pathname.includes('/admin/login');

  // For login page, return minimal layout
  if (isLoginPage) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GlobalErrorBoundary>
          <SupabaseProvider>
            {children}
            <Toaster />
          </SupabaseProvider>
        </GlobalErrorBoundary>
      </ThemeProvider>
    );
  }

  // For all other admin routes, check authentication
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/admin/login');
  }

  // Check admin status
  const { data: adminData } = await supabase
    .from('admin_users')
    .select(`
      admin_roles!inner (
        name
      )
    `)
    .eq('user_id', session.user.id)
    .single() as { data: AdminData | null, error: any };

  const role = adminData?.admin_roles?.name?.toLowerCase();
  if (!role || !['admin', 'super_admin'].includes(role)) {
    redirect('/admin/login');
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GlobalErrorBoundary>
        <SupabaseProvider>
          <AdminProvider>
            <div className="flex h-screen">
              {/* Admin Sidebar */}
              <Sidebar />
              
              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </AdminProvider>
        </SupabaseProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
} 