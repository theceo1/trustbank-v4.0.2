'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Users, Receipt, Wallet, LineChart, Settings } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Transactions', href: '/admin/transactions', icon: Receipt },
  { name: 'Wallets', href: '/admin/wallets', icon: Wallet },
  { name: 'Analytics', href: '/admin/analytics', icon: LineChart },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

function AdminSidebar({ pathname, onNavigate }: { pathname?: string; onNavigate?: () => void }) {
  const { signOut } = useAdminAuth();
  
  return (
    <div className="h-full py-6 pl-8 pr-6">
      <div className="flex flex-col gap-4">
        <div className="flex h-12 items-center">
          <Link href="/admin" className="font-bold text-xl">Admin Panel</Link>
        </div>
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' 
              ? pathname === '/admin'
              : pathname?.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </div>
  );
}

export function AdminLayoutClient({ children }: AdminLayoutProps) {
  const { isAdmin, isLoading } = useAdminAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render admin layout if user is authenticated and has admin permissions
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden fixed top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0">
            <AdminSidebar pathname={pathname} onNavigate={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto border-r border-border bg-background">
            <AdminSidebar pathname={pathname} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 md:pl-64">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
} 