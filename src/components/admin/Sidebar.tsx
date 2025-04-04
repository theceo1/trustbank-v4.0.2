'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  ChevronRight,
  LineChart,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Platform',
    href: '/admin/platform',
    icon: LineChart,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Wallets',
    href: '/admin/wallets',
    icon: Wallet,
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: ArrowLeftRight,
  },
  {
    name: 'Trade Guide',
    href: '/admin/trade-guide',
    icon: BookOpen,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-r bg-background',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-2 font-semibold',
            isCollapsed && 'justify-center'
          )}
        >
          {!isCollapsed && (
            <>
              <span className="text-primary text-xl">trustBank</span>
              <span className="text-sm text-muted-foreground">Admin</span>
            </>
          )}
          {isCollapsed && <span className="text-primary text-xl">TB</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {navigation.map((item) => {
            const isActive = item.href === '/admin' 
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-600/10 text-green-600'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-green-600")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-20 hidden md:flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
} 