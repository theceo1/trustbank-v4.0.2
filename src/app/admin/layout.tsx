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

export const metadata = {
  title: 'Admin Dashboard',
  description: 'TrustBank Admin Dashboard',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <AdminLayoutClient>
                {children}
              </AdminLayoutClient>
              <Toaster />
            </AdminProvider>
          </SupabaseProvider>
        </GlobalErrorBoundary>
      </ThemeProvider>
    </div>
  );
} 