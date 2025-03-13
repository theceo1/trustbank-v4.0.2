'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { InstantSwapModal } from '@/components/InstantSwapModal';

interface User {
  id: string;
  first_name?: string;
  user_metadata?: {
    first_name?: string;
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/auth/login');
        return;
      }

      // Get user's name from auth metadata and update user state
      const userData: User = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'there',
        user_metadata: user.user_metadata
      };
      setUser(userData);

      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', 'NGN')
        .single();

      if (walletsError) throw walletsError;
      setWallets([walletsData]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <Icons.spinner className="h-6 w-6 animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">
      {error}
    </div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/50 dark:bg-[#1c1917] rounded-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-medium text-emerald-600 dark:text-emerald-400">
              Welcome back, {user?.first_name || 'there'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Here{"'"}s an overview of your financial activities
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              onClick={() => setIsSwapModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Instant Swap
            </Button>
            <Button variant="destructive" size="sm" className="text-white dark:text-white">
              Verify Account
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 rounded-lg p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Icons.wallet className="h-4 w-4 opacity-90" />
              <h2 className="text-sm font-medium">NGN Wallet Balance</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-white text-emerald-600 hover:bg-white/90 text-xs">
                + Deposit
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Icons.eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-medium text-white/90">
              ₦ {wallets[0]?.balance ? parseFloat(wallets[0].balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
            <p className="text-xs text-white/70">Available Balance</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0a09] rounded-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Icons.arrowUpDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-200">Transaction Limits</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">Withdrawal (Daily)</span>
                <span className="text-gray-900 dark:text-gray-300">₦750K / ₦1M</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-yellow-400 w-[75%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">Deposit (Daily)</span>
                <span className="text-gray-900 dark:text-gray-300">₦2.5M / ₦5M</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[50%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">Trading (Daily)</span>
                <span className="text-gray-900 dark:text-gray-300">₦4.5M / ₦10M</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[45%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-[#1c1917] rounded-lg p-3 border border-orange-100 dark:border-orange-900/20">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Icons.userCheck className="h-5 w-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">Verify Your Account</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 mb-1">Complete KYC for higher limits</p>
              <Link href="/kyc" className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
                Verify Now →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1917] rounded-lg p-3 border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Icons.sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">New Features</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 mb-1">Enhanced crypto trading features</p>
              <Link href="/features" className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
                Learn More →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1917] rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Icons.trendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">Market Update</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 mb-1">Bitcoin hits new high!</p>
              <Link href="/market" className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
                View Analysis →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Transactions */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-[#1c1917] rounded-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/trade" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Icons.arrowUpDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Trade</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Buy and sell cryptocurrencies</p>
                </div>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>

            <Button
              onClick={() => setIsSwapModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
              variant="ghost"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <Icons.arrowUpDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Instant Swap</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Instantly swap between cryptocurrencies</p>
                </div>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Button>

            <Link href="/wallet" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                  <Icons.wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Manage Funds</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Deposit and withdraw funds</p>
                </div>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>

            <Link href="/transactions" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                  <Icons.history className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Transaction History</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">View your transaction history</p>
                </div>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>

            <Link href="/profile" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                  <Icons.settings className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Account Settings</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Manage your account settings</p>
                </div>
              </div>
              <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1917] rounded-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-200">Recent Transactions</h2>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
              All Transactions ↗
            </Button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">All</Button>
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Completed</Button>
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Pending</Button>
            <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Failed</Button>
          </div>

          <div className="mt-6 text-center">
            <Icons.inbox className="h-6 w-6 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-xs text-gray-600 dark:text-gray-400">No transactions found. Your transaction history will appear here once you make your first transaction.</p>
          </div>
        </div>
      </div>

      {/* Instant Swap Modal */}
      <InstantSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        wallet={wallets[0]}
      />
    </div>
  );
} 