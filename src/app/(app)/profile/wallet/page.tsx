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
  const [error, setError] = useState('');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isInstantSwapOpen, setIsInstantSwapOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Please sign in to view your wallet');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();

        if (response.ok) {
          setWalletData(data);
        } else {
          setError(data.message || 'Failed to load wallet data');
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin">
              <Icons.spinner className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading your wallet...</p>
          </div>
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
    console.log('Wallet value calculation:', {
      currency: wallet.currency,
      balance: wallet.balance,
      price: marketInfo?.price,
      value
    });
    return total + value;
  }, 0);

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
            onClick={() => {
              setIsDepositOpen(true);
              setSelectedWallet(wallets[0]); // Set the first wallet as default, adjust as needed
            }} 
            className="w-full h-auto py-2.5 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-1"
          >
            <Icons.download className="h-4 w-4" />
            <span className="text-sm">Deposit</span>
          </Button>
          <Button 
            onClick={() => {
              setIsWithdrawOpen(true);
              setSelectedWallet(wallets[0]); // Set the first wallet as default, adjust as needed
            }} 
            className="w-full h-auto py-2.5 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center gap-1"
          >
            <Icons.upload className="h-4 w-4" />
            <span className="text-sm">Withdraw</span>
          </Button>
          <Button 
            onClick={() => setIsInstantSwapOpen(true)} 
            className="w-full h-auto py-2.5 bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center gap-1"
          >
            <Icons.refresh className="h-4 w-4" />
            <span className="text-sm">Instant Swap</span>
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

      {/* Deposit Modal */}
      {isDepositOpen && selectedWallet && (
        <DepositModal
          isOpen={isDepositOpen}
          onClose={() => {
            setIsDepositOpen(false);
            setSelectedWallet(null);
          }}
          wallet={selectedWallet}
        />
      )}

      {/* Withdraw Modal */}
      {isWithdrawOpen && selectedWallet && (
        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => {
            setIsWithdrawOpen(false);
            setSelectedWallet(null);
          }}
          wallet={selectedWallet}
          userId={userId}
        />
      )}

      {/* Instant Swap Modal */}
      {isInstantSwapOpen && (
        <InstantSwapModal
          isOpen={isInstantSwapOpen}
          onClose={() => setIsInstantSwapOpen(false)}
          wallet={wallets[0]}
        />
      )}
    </div>
  );
} 