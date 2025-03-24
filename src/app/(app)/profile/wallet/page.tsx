'use client';

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { WalletListWrapper } from '@/components/wallet/WalletListWrapper'
import { TransactionHistory } from '@/components/wallet/TransactionHistory'
import { AssetDistribution } from '@/components/wallet/AssetDistribution'
import { PortfolioValue } from '@/components/wallet/PortfolioValue'
import Link from 'next/link'
import { BalanceProvider } from '@/components/wallet/BalanceContext'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InstantSwapModal } from '@/components/InstantSwapModal'
import { WithdrawModal } from '@/components/wallet/WithdrawModal'
import { DepositModal } from '@/components/wallet/DepositModal'
import { GeneralDepositModal } from '@/components/wallet/GeneralDepositModal'
import { GeneralWithdrawModal } from '@/components/wallet/GeneralWithdrawModal'
import { GeneralSwapModal } from '@/components/wallet/GeneralSwapModal'

interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
}

interface WalletData {
  wallets: any[];
  marketData: MarketData[];
  transactions: any[];
  userId: string;
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isInstantSwapOpen, setIsInstantSwapOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isGeneralDepositOpen, setIsGeneralDepositOpen] = useState(false);
  const [isGeneralWithdrawOpen, setIsGeneralWithdrawOpen] = useState(false);
  const [isGeneralSwapOpen, setIsGeneralSwapOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const supabase = createClientComponentClient();

  // Function to fetch wallet data
  const fetchWalletData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session found');
        return;
      }

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      setWalletData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    // Fetch updates every 10 seconds
    const interval = setInterval(fetchWalletData, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Set up WebSocket subscription for instant updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to wallet changes
        const walletSubscription = supabase
          .channel('wallet_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'wallets'
          }, (payload) => {
            console.log('Wallet change detected:', payload);
            fetchWalletData();
          })
          .subscribe();

        // Subscribe to transaction changes
        const transactionSubscription = supabase
          .channel('transaction_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'transactions'
          }, (payload) => {
            console.log('Transaction change detected:', payload);
            fetchWalletData();
          })
          .subscribe();

        // Subscribe to swap transaction changes
        const swapSubscription = supabase
          .channel('swap_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'swap_transactions'
          }, (payload: { new: { status?: string } }) => {
            console.log('Swap change detected:', payload);
            if (payload.new?.status === 'completed') {
              console.log('Swap completed, refreshing wallet data');
              fetchWalletData();
            }
          })
          .subscribe();

        // Clean up subscriptions
        return () => {
          walletSubscription.unsubscribe();
          transactionSubscription.unsubscribe();
          swapSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
      }
    };

    setupRealtimeSubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Icons.warning className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Unable to load wallet data</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Icons.user className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Complete Your Registration</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please complete your registration to access your wallet.
              </p>
              <Button asChild>
                <Link href="/onboarding">
                  Complete Registration
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { wallets, marketData, transactions, userId } = walletData;

  // Calculate total portfolio value
  const totalValue = wallets.reduce((total: number, wallet: any) => {
    const marketInfo = marketData.find(m => m.currency === wallet.currency?.toUpperCase());
    const value = (parseFloat(wallet.balance || '0') * (marketInfo?.price || 0));
    return total + value;
  }, 0);

  const handleDepositClick = (specificWallet?: any) => {
    if (specificWallet) {
      setSelectedWallet(specificWallet);
      setIsDepositOpen(true);
    } else {
      setIsGeneralDepositOpen(true);
    }
  };

  const handleWithdrawClick = (specificWallet?: any) => {
    if (specificWallet) {
      setSelectedWallet(specificWallet);
      setIsWithdrawOpen(true);
    } else {
      setIsGeneralWithdrawOpen(true);
    }
  };

  const handleSwapClick = (specificWallet?: any) => {
    if (specificWallet) {
      setSelectedWallet(specificWallet);
      setIsInstantSwapOpen(true);
    } else {
      setIsGeneralSwapOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 space-y-6">
      <BalanceProvider>
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">Wallet</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your crypto assets and transactions</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            onClick={() => handleDepositClick()}
            className="w-full h-auto py-4 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-2"
          >
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Icons.download className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Deposit</div>
              <div className="text-xs text-green-100">Add funds to your wallet</div>
            </div>
          </Button>
          <Button 
            onClick={() => handleWithdrawClick()}
            className="w-full h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center gap-2"
          >
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Icons.upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Withdraw</div>
              <div className="text-xs text-blue-100">Send funds to external wallet</div>
            </div>
          </Button>
          <Button 
            onClick={() => handleSwapClick()}
            className="w-full h-auto py-4 bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center gap-2"
          >
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Icons.refresh className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Instant Swap</div>
              <div className="text-xs text-purple-100">Exchange between currencies</div>
            </div>
          </Button>
        </div>

        {/* Upgrade Card */}
        <div className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-white">Upgrade Your Trading Experience</h2>
              <p className="text-sm text-white/80 mt-1">Get access to advanced trading features and lower fees</p>
            </div>
            <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-white/90">
              Learn More
            </Button>
          </div>
        </div>

        {/* Portfolio Value */}
        <PortfolioValue value={totalValue} />

        {/* Wallets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">{wallets?.length || 0} wallet{wallets?.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            {/* Wallet List */}
            <WalletListWrapper
              wallets={wallets}
              marketData={marketData}
              userId={userId}
              onDeposit={handleDepositClick}
              onWithdraw={handleWithdrawClick}
              onSwap={handleSwapClick}
            />

            {/* Asset Distribution */}
            <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Asset Distribution</h3>
              <AssetDistribution wallets={wallets} marketData={marketData} />
            </div>
          </div>

          {/* Transaction History */}
          <TransactionHistory transactions={transactions} />
        </div>
      </BalanceProvider>

      {/* Wallet-specific Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setSelectedWallet(null);
        }}
        wallet={selectedWallet}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen && selectedWallet !== null}
        onClose={() => {
          setIsWithdrawOpen(false);
          setSelectedWallet(null);
        }}
        wallet={selectedWallet!}
        userId={userId}
      />

      <InstantSwapModal
        isOpen={isInstantSwapOpen}
        onClose={() => {
          setIsInstantSwapOpen(false);
          setSelectedWallet(null);
        }}
        wallet={selectedWallet}
      />

      {/* General Action Modals */}
      <GeneralDepositModal
        isOpen={isGeneralDepositOpen}
        onClose={() => setIsGeneralDepositOpen(false)}
      />

      <GeneralWithdrawModal
        isOpen={isGeneralWithdrawOpen}
        onClose={() => setIsGeneralWithdrawOpen(false)}
      />

      <GeneralSwapModal
        isOpen={isGeneralSwapOpen}
        onClose={() => setIsGeneralSwapOpen(false)}
      />
    </div>
  );
} 