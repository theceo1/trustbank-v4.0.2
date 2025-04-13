'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowLeftRight
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MotionDiv = motion.div;

export default function TradeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/trade/guide') {
    return children;
  }

  const tradingOptions = [
    {
      href: '/trade',
      icon: Wallet,
      title: 'Quick Buy/Sell',
      description: 'Buy or sell crypto instantly with NGN at market price. Perfect for beginners.',
      tags: [
        { text: 'NGN', color: 'green' },
        { text: 'BTC', color: 'blue' },
        { text: 'ETH', color: 'purple' }
      ]
    },
    {
      href: '/trade/spot',
      icon: TrendingUp,
      title: 'Advanced Trading',
      description: 'Professional trading interface with charts, order books, and advanced order types.',
      tags: [
        { text: 'Limit', color: 'yellow' },
        { text: 'Market', color: 'orange' },
        { text: 'Stop', color: 'red' }
      ]
    },
    {
      href: '/trade/p2p',
      icon: Users,
      title: 'P2P Exchange',
      description: 'Buy/sell directly with other users. Set your own prices and payment methods.',
      tags: [
        { text: 'Bank Transfer', color: 'green' },
        { text: 'USSD', color: 'blue' }
      ]
    },
    {
      href: '/trade/swap',
      icon: ArrowLeftRight,
      title: 'Crypto Swap',
      description: 'Instantly convert between cryptocurrencies at guaranteed rates. No order book needed.',
      tags: [
        { text: 'BTC/ETH', color: 'blue' },
        { text: 'ETH/USDT', color: 'purple' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="space-y-4">
          {/* Welcome Section */}
          <div className="flex flex-col gap-2 py-4 border-b">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to trustBank Trading</h1>
            <p className="text-muted-foreground">Experience seamless trading with our advanced platform. Choose from multiple trading options and enjoy competitive rates with top-notch security.</p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tradingOptions.map((option) => {
              const Icon = option.icon;
              const isActive = pathname === option.href;
              return (
                <Link 
                  key={option.href} 
                  href={option.href}
                  className={cn(
                    "flex flex-col gap-3 p-4 rounded-lg border transition-all duration-200",
                    isActive
                      ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/10"
                      : "bg-card hover:bg-accent/5 border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-md",
                      isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className={cn(
                      "font-medium",
                      isActive ? "text-primary" : "text-foreground"
                    )}>
                      {option.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.tags.map((tag, i) => (
                      <span 
                        key={i}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md",
                          `bg-${tag.color}-500/10 text-${tag.color}-500`
                        )}
                      >
                        {tag.text}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Main Content */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </MotionDiv>
        </div>
      </div>
    </div>
  );
}