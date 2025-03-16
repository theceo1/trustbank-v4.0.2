'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  Shield, 
  Clock, 
  LineChart 
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const MotionLink = motion.create(Link);
const MotionDiv = motion.create('div');

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function TradeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

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
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/50 dark:to-blue-950/50">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Banner */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 mb-8"
        >
          {/* Gradient Mesh Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,255,95,0.1),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(0,255,149,0.05),transparent_50%)]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                Welcome to trustBank Trading
              </h1>
              <p className="text-slate-300 max-w-3xl text-base">
                Experience seamless trading with our advanced platform. Choose from multiple trading options
                and enjoy competitive rates with top-notch security.
              </p>
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Clock className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">24/7 Trading</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <LineChart className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Real-time Rates</span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center p-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-full" />
                <TrendingUp size={100} className="text-green-400 relative z-10" />
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Trading Options */}
        <motion.div 
          className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {tradingOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <MotionLink
                key={option.href}
                href={option.href}
                variants={fadeInUp}
                className={cn(
                  "group relative rounded-xl transition-all duration-300 hover:shadow-lg",
                  pathname === option.href ? 'bg-green-50 dark:bg-green-900/20 shadow-lg' : 'bg-white dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20'
                )}
              >
                <Card className="border-0 bg-transparent h-full">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Icon className={cn(
                          "h-6 w-6 mb-3 transition-colors",
                          pathname === option.href ? 'text-green-600' : 'text-muted-foreground group-hover:text-green-600'
                        )} />
                        <h3 className="font-semibold mb-2">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {option.tags.map((tag, i) => (
                            <span
                              key={i}
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                `bg-${tag.color}-100 dark:bg-${tag.color}-900/20 text-${tag.color}-600`
                              )}
                            >
                              {tag.text}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </Card>
              </MotionLink>
            );
          })}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 