'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { formatAmount, cn } from "@/lib/utils";
import Link from 'next/link';
import { InstantSwapModal } from '@/components/InstantSwapModal';
import DepositModal from '@/components/wallet/DepositModal';
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
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

interface WalletData {
  totalValue: number;
  wallets: Array<{
    id: string;
    currency: string;
    balance: string;
    estimated_value: number;
  }>;
}

export default function ClientDashboard({ 
  user,
  kycStatus,
  limits,
  volumeTrades,
  transactions 
}: ClientDashboardProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/wallet');
        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }
        const data = await response.json();
        setWalletData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <svg
          className="animate-spin h-8 w-8 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="border-b">
          <h1 className="text-lg font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm italic">
            Welcome back! Here's an overview of your account and quick actions.
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 border-green-200/50 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Balance</p>
                    <h2 className="text-3xl font-bold mt-2 text-green-900 dark:text-green-100">
                      {isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : error ? (
                        <span className="text-red-500">Error loading balance</span>
                      ) : isBalanceHidden ? (
                        '•••••••'
                      ) : walletData?.totalValue ? (
                        formatAmount(walletData.totalValue, 'NGN')
                      ) : (
                        '₦0.00'
                      )}
                    </h2>
                  </div>
                  <p className="text-sm text-green-700/70 dark:text-green-300/70">
                    Total value across all wallets
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBalanceVisibility}
                  className="h-8 w-8 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                >
                  {isBalanceHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="link"
                className="absolute bottom-4 right-4 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                asChild
              >
                <Link href="/profile/wallet">View Details <ChevronRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Monthly Volume</p>
                  <h2 className="text-3xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                    {isBalanceHidden ? '••••••' : formatAmount(limits.trading_used || 0, 'NGN')}
                  </h2>
                </div>
                <p className="text-sm text-blue-700/70 dark:text-blue-300/70">
                  Your trading volume this month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20 border-amber-200/50 dark:border-amber-800/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Withdrawal Limit</p>
                  <h2 className="text-3xl font-bold mt-2 text-amber-900 dark:text-amber-100">
                    {isBalanceHidden ? '••••••' : formatAmount(limits.withdrawal_limit || 0, 'NGN')}
                  </h2>
                </div>
                <p className="text-sm text-amber-700/70 dark:text-amber-300/70">
                  Your remaining withdrawal limit
                </p>
              </div>
            </CardContent>
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
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Button
            onClick={() => setIsDepositModalOpen(true)}
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-gradient-to-br from-emerald-100 to-green-200 hover:from-emerald-200 hover:to-green-300 dark:from-emerald-500/30 dark:to-green-500/30 dark:hover:from-emerald-500/40 dark:hover:to-green-500/40 text-emerald-900 dark:text-emerald-100 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <Wallet className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Deposit</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Add funds</p>
            </div>
          </Button>
          <Button
            onClick={() => setIsSwapModalOpen(true)}
            className="h-24 flex flex-col items-center justify-center space-y-1 bg-gradient-to-br from-blue-100 to-indigo-200 hover:from-blue-200 hover:to-indigo-300 dark:from-blue-500/30 dark:to-indigo-500/30 dark:hover:from-blue-500/40 dark:hover:to-indigo-500/40 text-blue-900 dark:text-blue-100 border border-blue-200/50 dark:border-blue-800/50"
          >
            <ArrowRightLeft className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Instant Swap</p>
              <p className="text-xs text-blue-700/70 dark:text-blue-300/70">Swap between crypto</p>
            </div>
          </Button>
          <Link href="/trade" className="contents">
            <Button
              className="h-24 flex flex-col items-center justify-center space-y-1 bg-gradient-to-br from-purple-100 to-fuchsia-200 hover:from-purple-200 hover:to-fuchsia-300 dark:from-purple-500/30 dark:to-fuchsia-500/30 dark:hover:from-purple-500/40 dark:hover:to-fuchsia-500/40 text-purple-900 dark:text-purple-100 border border-purple-200/50 dark:border-purple-800/50"
            >
              <LineChart className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Trade</p>
                <p className="text-xs text-purple-700/70 dark:text-purple-300/70">Buy and sell crypto</p>
              </div>
            </Button>
          </Link>
          <Link href="/history" className="contents">
            <Button
              className="h-24 flex flex-col items-center justify-center space-y-1 bg-gradient-to-br from-amber-100 to-orange-200 hover:from-amber-200 hover:to-orange-300 dark:from-amber-500/30 dark:to-orange-500/30 dark:hover:from-amber-500/40 dark:hover:to-orange-500/40 text-amber-900 dark:text-amber-100 border border-amber-200/50 dark:border-amber-800/50"
            >
              <History className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Transaction History</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-300/70">View your transactions</p>
              </div>
            </Button>
          </Link>
          <Link href="/settings" className="contents">
            <Button
              className="h-24 flex flex-col items-center justify-center space-y-1 bg-gradient-to-br from-gray-100 to-zinc-200 hover:from-gray-200 hover:to-zinc-300 dark:from-gray-500/30 dark:to-zinc-500/30 dark:hover:from-gray-500/40 dark:hover:to-zinc-500/40 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-800/50"
            >
              <Settings className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Account Settings</p>
                <p className="text-xs text-gray-700/70 dark:text-gray-300/70">Manage your account</p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-0">
          <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-green-600 hover:text-white transition-all duration-200 h-12" 
              asChild
            >
              <Link href="/profile/wallet">
                <Wallet className="h-5 w-5 mr-3" />
                <div>
                  <span className="font-medium">View Full Portfolio</span>
                  <span className="text-xs text-muted-foreground ml-2">Check your assets</span>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-green-600 hover:text-white transition-all duration-200 h-12" 
              asChild
            >
              <Link href="/trade">
                <ArrowRightLeft className="h-5 w-5 mr-3" />
                <div>
                  <span className="font-medium">Trade Crypto</span>
                  <span className="text-xs text-muted-foreground ml-2">Buy & sell crypto</span>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-green-600 hover:text-white transition-all duration-200 h-12" 
              asChild
            >
              <Link href="/trade/p2p">
                <Users className="h-5 w-5 mr-3" />
                <div>
                  <span className="font-medium">P2P Trading</span>
                  <span className="text-xs text-muted-foreground ml-2">Trade with users</span>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
        
        {/* Recent Transactions */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Transactions</h3>
            <Button variant="ghost" size="sm" asChild className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20">
              <Link href="/transactions">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start trading to see your transactions here</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSwapModalOpen(true)}
                className="bg-white dark:bg-gray-800 hover:bg-green-600 hover:text-white"
              >
                Make Your First Trade
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      tx.type === 'deposit' ? "bg-green-100 text-green-600" :
                      tx.type === 'withdrawal' ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {tx.type === 'deposit' ? <ArrowDownRight className="h-4 w-4" /> :
                       tx.type === 'withdrawal' ? <ArrowUpRight className="h-4 w-4" /> :
                       <ArrowRightLeft className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {tx.type === 'withdrawal' ? '-' : '+'}
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ ₦{formatAmount(tx.amount * (tx.rate || 1), 'NGN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
      
      <InstantSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        wallet={walletData?.wallets?.[0]}
      />
    </div>
  );
} 