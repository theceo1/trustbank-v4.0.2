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
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw
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
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  from_currency?: string;
  to_currency?: string;
  to_amount?: number;
  execution_price?: number;
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

function UserLimits({ limits }: { limits: UserLimits }) {
  const calculatePercentage = (used: number, limit: number) => {
    return (used / limit) * 100;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/5 border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Trading Limits</h3>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Trading Volume</span>
            <span className="text-sm font-medium">{formatAmount(limits.trading_used, 'NGN')} / {formatAmount(limits.trading_limit, 'NGN')}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${calculatePercentage(limits.trading_used, limits.trading_limit)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Deposit Limit</span>
            <span className="text-sm font-medium">{formatAmount(limits.deposit_used, 'NGN')} / {formatAmount(limits.deposit_limit, 'NGN')}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${calculatePercentage(limits.deposit_used, limits.deposit_limit)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Withdrawal Limit</span>
            <span className="text-sm font-medium">{formatAmount(limits.withdrawal_used, 'NGN')} / {formatAmount(limits.withdrawal_limit, 'NGN')}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${calculatePercentage(limits.withdrawal_used, limits.withdrawal_limit)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Your trading limits are based on your KYC tier and 30-day trading volume. Higher trading volume and KYC tier unlock better fees and higher limits. Visit the <Link href="/trade/guide" className="text-primary hover:underline">Trading Guide</Link> to learn more.
          </p>
        </div>
      </div>
    </Card>
  );
}

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

          // Calculate 30-day trading volume
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          // Fetch trades for volume calculation
          const { data: volumeTrades, error: volumeTradesError } = await supabase
            .from('trades')
            .select('amount, price')
            .eq('user_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          console.log('Trades for volume:', volumeTrades);

          if (volumeTradesError) {
            console.error('Error fetching trades:', volumeTradesError);
          }

          // Calculate total trading volume from trades
          const totalTradingVolume = volumeTrades?.reduce((total, trade) => {
            try {
              const tradeVolume = parseFloat(trade.amount) * parseFloat(trade.price);
              console.log('Trade volume:', tradeVolume);
              return total + tradeVolume;
            } catch (error) {
              console.error('Error processing trade:', error, trade);
              return total;
            }
          }, 0) || 0;

          console.log('Total trading volume:', totalTradingVolume);

          // Fetch or create user limits
          const { data: limitsData, error: limitsError } = await supabase
            .from('user_limits')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          console.log('Current limits data:', limitsData);

          if (limitsError && limitsError.code !== 'PGRST116') {
            console.error('Error fetching user limits:', limitsError);
          }

          // Update limits with trading volume
          const updatedLimits = {
            ...(limitsData || DEFAULT_LIMITS),
            trading_used: totalTradingVolume,
            // Keep existing used values for deposit and withdrawal if they exist
            deposit_used: limitsData?.deposit_used || 0,
            withdrawal_used: limitsData?.withdrawal_used || 0
          };

          console.log('Updated limits:', updatedLimits);

          if (!limitsData) {
            // Create default limits for the user
            const { data: newLimits, error: createError } = await supabase
              .from('user_limits')
              .insert([{
                user_id: user.id,
                withdrawal_used: 0,
                withdrawal_limit: 1000000,
                deposit_used: 0,
                deposit_limit: 5000000,
                trading_used: totalTradingVolume,
                trading_limit: 10000000
              }])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user limits:', createError);
            } else {
              console.log('Created new limits:', newLimits);
              setLimits(newLimits);
            }
          } else {
            // Update existing limits with new trading volume
            const { error: updateError } = await supabase
              .from('user_limits')
              .update({ trading_used: totalTradingVolume })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating trading volume:', updateError);
            } else {
              console.log('Setting updated limits:', updatedLimits);
              setLimits(updatedLimits);
            }
          }

          // Fetch transactions for display
          const { data: displayRegularTxs, error: displayRegularError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (displayRegularError) throw displayRegularError;

          const { data: displaySwapTxs, error: displaySwapError } = await supabase
            .from('swap_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (displaySwapError) throw displaySwapError;

          // Format regular transactions
          const formattedRegularTxs = (displayRegularTxs || []).map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: parseFloat(tx.amount),
            currency: tx.currency,
            status: tx.status,
            created_at: tx.created_at
          }));

          // Format swap transactions
          const formattedSwapTxs = (displaySwapTxs || []).map(tx => ({
            id: tx.id,
            type: 'swap' as const,
            amount: parseFloat(tx.from_amount),
            currency: tx.from_currency,
            from_currency: tx.from_currency,
            to_currency: tx.to_currency,
            to_amount: parseFloat(tx.to_amount),
            execution_price: parseFloat(tx.execution_price),
            status: tx.status,
            created_at: tx.created_at
          }));

          // Combine and sort all transactions by date
          const allTransactions = [...formattedRegularTxs, ...formattedSwapTxs]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5); // Keep only the 5 most recent

          setTransactions(allTransactions);
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

      {/* Transactions and Limits Section */}
      <div className="grid gap-6 md:grid-cols-2">
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
                      tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/20' :
                      tx.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900/20' :
                      tx.type === 'swap' ? 'bg-purple-100 dark:bg-purple-900/20' :
                      'bg-blue-100 dark:bg-blue-900/20'
                    )}>
                      {tx.type === 'deposit' && <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {tx.type === 'withdrawal' && <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      {tx.type === 'swap' && <RefreshCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      {tx.type === 'transfer' && <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      tx.type === 'deposit' ? 'text-green-600 dark:text-green-400' :
                      tx.type === 'withdrawal' ? 'text-red-600 dark:text-red-400' :
                      'text-blue-600 dark:text-blue-400'
                    )}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </p>
                    {tx.type === 'swap' && tx.to_amount && (
                      <p className="text-sm text-muted-foreground">
                        → {formatAmount(tx.to_amount, tx.to_currency || '')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent transactions</p>
            </div>
          )}
        </Card>

        {/* User Limits */}
        <UserLimits limits={limits} />
      </div>

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