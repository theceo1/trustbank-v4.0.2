import React from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import SupabaseProvider from "@/lib/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export const metadata = {
  title: 'Admin Dashboard - trustBank',
  description: 'trustBank Admin Dashboard',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect('/auth/login');
  }

  // Get user's role from admin_users table
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      admin_roles!inner (
        name,
        permissions
      )
    `)
    .eq('user_id', session.user.id)
    .single() as { 
      data: { 
        admin_roles: { 
          name: string; 
          permissions: string[]; 
        }; 
      } | null; 
      error: any; 
    };

  if (adminError || !adminData?.admin_roles) {
    redirect('/');
  }

  const role = adminData.admin_roles.name.toLowerCase();

  // Check if user has admin or super_admin role
  if (!['admin', 'super_admin'].includes(role)) {
    redirect('/');
  }

  return (
    <div className={cn(
      'min-h-screen bg-background font-sans antialiased',
      GeistSans.variable,
      GeistMono.variable
    )}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GlobalErrorBoundary>
          <SupabaseProvider>
            <AdminProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </AdminProvider>
          </SupabaseProvider>
        </GlobalErrorBoundary>
      </ThemeProvider>
    </div>
  );
} 