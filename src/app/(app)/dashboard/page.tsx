'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { InstantSwapModal } from '@/components/InstantSwapModal';
import { DepositModal } from '@/components/wallet/DepositModal';
import { EyeOff, Eye } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  LineChart,
  Wallet,
  History,
  Settings,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface User {
  id: string;
  email?: string;
  first_name?: string;
  user_metadata?: {
    first_name?: string;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface KYCStatus {
  status: string;
  tier: number;
}

interface UserLimits {
  withdrawal_used: number;
  withdrawal_limit: number;
  deposit_used: number;
  deposit_limit: number;
  trading_used: number;
  trading_limit: number;
}

const DEFAULT_LIMITS: UserLimits = {
  withdrawal_used: 0,
  withdrawal_limit: 1000000,
  deposit_used: 0,
  deposit_limit: 5000000,
  trading_used: 0,
  trading_limit: 10000000
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>({ status: 'unverified', tier: 0 });
  const [limits, setLimits] = useState<UserLimits>(DEFAULT_LIMITS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);

          // Fetch KYC status
          const { data: kycData } = await supabase
            .from('kyc_verifications')
            .select('status, tier')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (kycData) {
            setKycStatus(kycData);
          }

          // Fetch user limits
          const { data: limitsData } = await supabase
            .from('user_limits')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (limitsData) {
            setLimits(limitsData);
          }

          // Fetch transactions
          const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (txData) {
            setTransactions(txData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, [supabase]);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/5 border-0 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">
                {isBalanceHidden ? '•••••••' : formatAmount(0, 'NGN')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBalanceVisibility}
              className="h-8 w-8"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/5 border-0 p-6">
          <p className="text-sm font-medium text-muted-foreground">Monthly Volume</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">{isBalanceHidden ? '••••••' : formatAmount(limits.trading_used, 'NGN')}</h2>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/5 border-0 p-6">
          <p className="text-sm font-medium text-muted-foreground">Withdrawal Limit</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {isBalanceHidden ? '••••••' : formatAmount(limits.withdrawal_used, 'NGN')}
          </h2>
        </Card>
      </div>

      {/* KYC Verification Prompt */}
      {kycStatus.status === 'unverified' && (
        <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-0 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Complete Your Verification
              </h3>
              <p className="text-amber-800 dark:text-amber-200 mt-1">
                Verify your identity to unlock higher limits and all features
              </p>
            </div>
            <Button
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white"
              asChild
            >
              <Link href="/kyc">Start Verification</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 border-0 p-6">
        <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={() => setIsSwapModalOpen(true)}
          >
            <ArrowRightLeft className="h-6 w-6" />
            <div className="text-center">
              <p className="font-semibold">Instant Swap</p>
              <p className="text-xs text-muted-foreground">Swap between cryptocurrencies</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            asChild
          >
            <Link href="/trade">
              <LineChart className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Trade</p>
                <p className="text-xs text-muted-foreground">Buy and sell cryptocurrencies</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            asChild
          >
            <Link href="/profile/wallet">
              <Wallet className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Manage Funds</p>
                <p className="text-xs text-muted-foreground">Deposit and withdraw funds</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            asChild
          >
            <Link href="/transactions">
              <History className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Transaction History</p>
                <p className="text-xs text-muted-foreground">View your transactions</p>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
            asChild
          >
            <Link href="/profile">
              <Settings className="h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Account Settings</p>
                <p className="text-xs text-muted-foreground">Manage your account</p>
              </div>
            </Link>
          </Button>
        </div>
      </Card>

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
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  )}>
                    <TrendingUp className={cn(
                      "h-4 w-4",
                      tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "font-bold",
                  tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent transactions</p>
          </div>
        )}
      </Card>

      <InstantSwapModal 
        isOpen={isSwapModalOpen} 
        onClose={() => setIsSwapModalOpen(false)} 
      />
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
    </div>
  );
} 