//src/app/(app)/profile/wallet/page.tsx
'use client';

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { WalletListWrapper } from '@/components/wallet/WalletListWrapper'
import { TransactionHistory } from '@/components/wallet/TransactionHistory'

// ...other imports

import { AssetDistribution } from '@/components/wallet/AssetDistribution'
import { PortfolioValue } from '@/components/wallet/PortfolioValue'
import Link from 'next/link'
import { BalanceProvider } from '@/components/wallet/BalanceContext'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InstantSwapModal } from '@/components/InstantSwapModal'
import { WithdrawModal } from '@/components/wallet/WithdrawModal'
import DepositModal from '@/components/wallet/DepositModal'
import { GeneralDepositModal } from '@/components/wallet/GeneralDepositModal'
// import { GeneralWithdrawModal } from '@/components/wallet/GeneralWithdrawModal'
import { GeneralSwapModal } from '@/components/wallet/GeneralSwapModal'
import { Input } from '@/components/ui/input'

interface MarketData {
  currency: string;
  quote_currency: string;
  price: number;
  raw_price: number;
  change_24h: number;
}

interface WalletData {
  wallets: any[];
  marketData: MarketData[];
  transactions: any[];
  userId: string;
  totalValueNGN: number;
  totalValueUSD: number;
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isInstantSwapOpen, setIsInstantSwapOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isGeneralDepositOpen, setIsGeneralDepositOpen] = useState(false);
  const [isGeneralWithdrawOpen, setIsGeneralWithdrawOpen] = useState(false);
  const [isGeneralSwapOpen, setIsGeneralSwapOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const supabase = createClientComponentClient();

  // Fetch all transactions for recent list
  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const allTransactions = await response.json();
      setRecentTransactions((allTransactions || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
    } catch (err) {
      setRecentTransactions([]);
    }
  };

  // Function to fetch wallet data
  const fetchWalletData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Supabase session:', session);
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
        if (response.status === 401) {
          setError('Your session has expired or you are not logged in. Please log in again to access your wallet.');
          setWalletData(null);
          return;
        }
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      setWalletData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchWalletData();
    fetchRecentTransactions();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchWalletData, 10000);
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
          }, () => {
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
          }, () => {
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
            if (payload.new?.status === 'completed') {
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
        setError('Error setting up realtime subscriptions');
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

  // ...rest of component


  if (error) {
    // Special UI for session/auth errors
    if (error.includes('session') || error.toLowerCase().includes('log in')) {
      return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Icons.warning className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Session Expired</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {error}
                </p>
                <Button asChild>
                  <Link href="/auth/login">
                    Log In Again
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Default error UI
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

  const { wallets, marketData, transactions, userId, totalValueNGN } = walletData;

  // Helper function to get market price
  const getMarketPrice = (currency: string) => {
    if (currency.toLowerCase() === 'ngn') {
      return 1;
    }

    // First try direct NGN pair
    const ngnPair = marketData.find(
      m => m.currency.toLowerCase() === currency.toLowerCase() && 
           m.quote_currency === 'NGN'
    );

    if (ngnPair?.price) {
      return ngnPair.price;
    }

    // Try USDT pair
    const usdtPair = marketData.find(
      m => m.currency.toLowerCase() === currency.toLowerCase() && 
           m.quote_currency === 'USDT'
    );
    
    const usdtNgnPair = marketData.find(
      m => m.currency === 'USDT' && m.quote_currency === 'NGN'
    );

    if (usdtPair?.price && usdtNgnPair?.price) {
      const price = usdtPair.price * usdtNgnPair.price;
      return price;
    }

    // Try BTC pair as last resort
    const btcPair = marketData.find(
      m => m.currency.toLowerCase() === currency.toLowerCase() && 
           m.quote_currency === 'BTC'
    );
    
    const btcUsdtPair = marketData.find(
      m => m.currency === 'BTC' && m.quote_currency === 'USDT'
    );

    if (btcPair?.price && btcUsdtPair?.price && usdtNgnPair?.price) {
      const price = btcPair.price * btcUsdtPair.price * usdtNgnPair.price;
      return price;
    }

    return 0;
  };

  // Calculate total portfolio value
  const totalValue = wallets.reduce((total: number, wallet: any) => {
    const balance = parseFloat(wallet.balance || '0');
    const price = getMarketPrice(wallet.currency);
    return total + (balance * price);
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
        <div className="py-8 border-b">
          <h1 className="text-xl font-bold tracking-tight mb-2">Wallet</h1>
          <p className="text-muted-foreground text-sm italic">
            Manage your crypto assets and transactions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            onClick={() => handleDepositClick()}
            className="w-full h-auto py-6 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Icons.download className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Deposit</div>
              <div className="text-xs text-green-100">Add funds to your wallet</div>
            </div>
          </Button>
          <Button 
            onClick={() => handleWithdrawClick()}
            className="w-full h-auto py-6 bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center gap-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Icons.upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Withdraw</div>
              <div className="text-xs text-purple-100">Send funds to external wallet</div>
            </div>
          </Button>
          <Button 
            onClick={() => handleSwapClick()}
            className="w-full h-auto py-6 bg-orange-600 hover:bg-orange-700 text-white flex flex-col items-center gap-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Icons.refresh className="h-5 w-5" />
            </div>
            <div className="text-center">
              <div className="font-medium">Instant Swap</div>
              <div className="text-xs text-orange-50">Exchange between currencies</div>
            </div>
          </Button>
        </div>

        {/* Portfolio Value */}
        <PortfolioValue value={totalValueNGN} />

        {/* Wallets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{wallets?.length || 0} wallet{wallets?.length !== 1 ? 's' : ''}</p>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => window.location.reload()}>
                <Icons.refresh className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsGeneralDepositOpen(true)}>
                <Icons.add className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            {/* Wallet List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Input
                  type="search"
                  placeholder="Search wallets..."
                  className="max-w-sm"
                />
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Icons.grid className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Icons.list className="h-4 w-4" />
                </Button>
              </div>
              <WalletListWrapper
                wallets={wallets}
                marketData={marketData}
                userId={userId}
                onDeposit={handleDepositClick}
                onWithdraw={handleWithdrawClick}
                onSwap={handleSwapClick}
              />
            </div>

            {/* Asset Distribution */}
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Asset Distribution</h3>
              <AssetDistribution wallets={wallets} marketData={marketData} />
            </div>
          </div>

          {/* Transaction History */}
          <TransactionHistory transactions={recentTransactions} />
        </div>
      </BalanceProvider>

      {/* Modals */}
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
      <GeneralDepositModal
        isOpen={isGeneralDepositOpen}
        onClose={() => setIsGeneralDepositOpen(false)}
      />
      <GeneralSwapModal
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