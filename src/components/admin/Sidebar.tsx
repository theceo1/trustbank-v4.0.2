'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  LineChart,
  Settings,
  Shield,
  Bell,
  History,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: History,
  },
  {
    title: 'Wallets',
    href: '/admin/wallets',
    icon: Wallet,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: LineChart,
  },
  {
    title: 'Security',
    href: '/admin/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive && 'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-500'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
} 