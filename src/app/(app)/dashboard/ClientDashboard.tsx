'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { formatAmount } from "@/lib/utils";
import Link from 'next/link';
import { InstantSwapModal } from '@/components/InstantSwapModal';
import { DepositModal } from '@/components/wallet/DepositModal';
import {
  ArrowRightLeft,
  LineChart,
  Wallet,
  History,
  Settings,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  EyeOff,
  Eye,
  Gift,
  Zap,
  ArrowRight,
  Users
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface ClientDashboardProps {
  user: any;
  kycStatus: {
    status: string;
    tier: number;
  };
  limits: {
    withdrawal_limit: number;
    trading_limit: number;
    withdrawal_used: number;
    trading_used: number;
  };
  volumeTrades: any[];
  transactions: any[];
}

export default function ClientDashboard({ 
  user,
  kycStatus,
  limits,
  volumeTrades,
  transactions 
}: ClientDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">
            <RefreshCcw className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Dashboard Header */}
      <div className="space-y-2">
        <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your account and quick actions.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 border border-gray-800/10 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <h2 className="text-2xl font-bold mt-2">
                {isBalanceHidden ? '•••••••' : formatAmount(0, 'NGN')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBalanceVisibility}
              className="h-8 w-8"
            >
              {isBalanceHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-gray-800/10 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Volume</p>
              <h2 className="text-2xl font-bold mt-2">
                {isBalanceHidden ? '••••••' : formatAmount(limits.trading_used || 0, 'NGN')}
              </h2>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border border-gray-800/10 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Withdrawal Limit</p>
              <h2 className="text-2xl font-bold mt-2">
                {isBalanceHidden ? '••••••' : formatAmount(limits.withdrawal_limit || 0, 'NGN')}
              </h2>
            </div>
          </div>
        </Card>
      </div>

      {/* KYC Verification Prompt */}
      {kycStatus.status !== 'verified' && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Complete Your Verification
              </h3>
              <p className="text-amber-800/90 dark:text-amber-200/90 mt-1">
                Verify your identity to unlock higher limits and all features
              </p>
            </div>
            <Button
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white border-0"
              asChild
            >
              <Link href="/kyc">Start Verification</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Update the second announcement to P2P - Made more compact */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* First Announcement */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 border-0">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10 shrink-0">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-base">Earn 50 USDT Welcome Bonus!</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">Complete your first trade for bonus</p>
                  <Button asChild variant="link" className="p-0 h-auto text-purple-600 hover:text-purple-700 text-xs">
                    <Link href="/trade" className="flex items-center">
                      Trade <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Second Announcement - Updated to P2P */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border-0">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-base">Try P2P Trading!</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">Trade directly with other users</p>
                  <Button asChild variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 text-xs">
                    <Link href="/trade/p2p" className="flex items-center">
                      P2P <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="relative h-auto py-8 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-500 hover:to-emerald-600 text-gray-900 dark:text-white hover:text-white border border-green-100 dark:border-green-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            onClick={() => setIsSwapModalOpen(true)}
          >
            <ArrowRightLeft className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Instant Swap</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Swap between crypto</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="relative h-auto py-8 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-500 hover:to-emerald-600 text-gray-900 dark:text-white hover:text-white border border-green-100 dark:border-green-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            asChild
          >
            <Link href="/trade">
              <LineChart className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Trade</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Buy and sell crypto</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="relative h-auto py-8 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-500 hover:to-emerald-600 text-gray-900 dark:text-white hover:text-white border border-green-100 dark:border-green-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            asChild
          >
            <Link href="/profile/wallet">
              <Wallet className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Manage Funds</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Deposit and withdraw funds</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="relative h-auto py-8 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-500 hover:to-emerald-600 text-gray-900 dark:text-white hover:text-white border border-green-100 dark:border-green-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            asChild
          >
            <Link href="/transactions">
              <History className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Transaction History</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View your transactions</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="relative h-auto py-8 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-500 hover:to-emerald-600 text-gray-900 dark:text-white hover:text-white border border-green-100 dark:border-green-900/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            asChild
          >
            <Link href="/profile">
              <Settings className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Account Settings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
              </div>
            </Link>
          </Button>
        </div>
      </Card>

      {/* Transactions and Limits Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions" className="flex items-center">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/20' :
                      tx.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900/20' :
                      tx.type === 'swap' ? 'bg-purple-100 dark:bg-purple-900/20' :
                      'bg-blue-100 dark:bg-blue-900/20'
                    )}>
                      {tx.type === 'deposit' && <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {tx.type === 'withdrawal' && <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      {tx.type === 'swap' && <RefreshCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {tx.type === 'swap' ? (
                      <>
                        <p className="font-medium text-red-600">-{formatAmount(tx.amount, tx.currency)}</p>
                        <p className="text-sm text-green-600">+{formatAmount(tx.to_amount, tx.to_currency)}</p>
                      </>
                    ) : (
                      <p className={cn(
                        "font-medium",
                        tx.type === 'deposit' ? 'text-green-600' :
                        'text-red-600'
                      )}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                      </p>
                    )}
                    <span className={cn(
                      "inline-block px-2 py-1 text-xs rounded-full mt-1",
                      tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent transactions
            </div>
          )}
        </Card>

        {/* Trading Limits */}
        <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-800/50 p-6">
          <h3 className="text-lg font-semibold mb-6">Trading Limits</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Trading Volume</span>
                <span className="text-sm font-medium">
                  {formatAmount(limits.trading_used || 0, 'NGN')} / {formatAmount(limits.trading_limit || 10000000, 'NGN')}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(((limits.trading_used || 0) / (limits.trading_limit || 10000000)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Deposit Limit</span>
                <span className="text-sm font-medium">
                  {formatAmount(0, 'NGN')} / {formatAmount(5000000, 'NGN')}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Withdrawal Limit</span>
                <span className="text-sm font-medium">
                  {formatAmount(limits.withdrawal_used || 0, 'NGN')} / {formatAmount(limits.withdrawal_limit || 1000000, 'NGN')}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(((limits.withdrawal_used || 0) / (limits.withdrawal_limit || 1000000)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your trading limits are based on your KYC tier and 30-day trading volume. Higher trading volume and KYC tier unlock better fees and higher limits. Visit the <Link href="/trade/guide" className="text-primary hover:underline">Trading Guide</Link> to learn more.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <InstantSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
      />
    </div>
  );
} 