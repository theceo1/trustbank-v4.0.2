import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { WalletListWrapper } from '@/components/wallet/WalletListWrapper'
import { TransactionHistory } from '@/components/wallet/TransactionHistory'
import { AssetDistribution } from '@/components/wallet/AssetDistribution'
import { PortfolioValue } from '@/components/wallet/PortfolioValue'
import { getWallets, getMarketTickers, getSwapTransactions, QuidaxWallet } from '@/lib/quidax'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BalanceProvider } from '@/components/wallet/BalanceContext'

interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WalletPage() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore 
    })
    
    const { data: { session }, error: supabaseError } = await supabase.auth.getSession()
    
    if (supabaseError || !session?.user) {
      console.error('Supabase auth error:', supabaseError)
      redirect('/auth/login')
    }

    // Get user profile data from user_profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      throw new Error('Unable to fetch user profile')
    }

    if (!userProfile?.quidax_id) {
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
      )
    }

    try {
      // Fetch data from Quidax using the Quidax ID
      const [walletsResponse, marketDataResponse, transactionsResponse] = await Promise.all([
        getWallets(userProfile.quidax_id),
        getMarketTickers(),
        getSwapTransactions(userProfile.quidax_id)
      ]);

      const wallets = walletsResponse.data || [];
      console.log('Market Data Response:', marketDataResponse);

      const marketData = Object.entries(marketDataResponse.data || {})
        .filter(([key]) => key.toLowerCase().endsWith('ngn'))
        .map(([key, value]: [string, any]) => {
          if (!value || !value.ticker) return null;
          const currency = key.replace(/ngn$/i, '').toUpperCase();
          return {
            currency,
            price: value.ticker.last ? parseFloat(value.ticker.last) : 0,
            change_24h: value.ticker.price_change_percent ? 
              parseFloat(value.ticker.price_change_percent) : 0
          };
        })
        .filter((item): item is MarketData => item !== null);

      // Add NGN as a market data entry with price of 1
      marketData.push({
        currency: 'NGN',
        price: 1,
        change_24h: 0
      });

      console.log('Processed Market Data:', marketData);

      const transactions = transactionsResponse.data || [];

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
              <Link href="/deposit">
                <Button className="w-full h-auto py-2.5 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-1">
                  <Icons.download className="h-4 w-4" />
                  <span className="text-sm">Deposit</span>
                </Button>
              </Link>
              <Link href="/withdraw">
                <Button className="w-full h-auto py-2.5 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center gap-1">
                  <Icons.upload className="h-4 w-4" />
                  <span className="text-sm">Withdraw</span>
                </Button>
              </Link>
              <Link href="/instant-swap">
                <Button className="w-full h-auto py-2.5 bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center gap-1">
                  <Icons.refresh className="h-4 w-4" />
                  <span className="text-sm">Instant Swap</span>
                </Button>
              </Link>
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
                  userId={userProfile.quidax_id}
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
        </div>
      )
    } catch (quidaxError: any) {
      console.error('Quidax API error:', quidaxError)
      return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Icons.warning className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Unable to load wallet data</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quidaxError.message || 'Please check your API configuration and try again'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  } catch (error: any) {
    console.error('Error loading wallet page:', error)
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Icons.warning className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Unable to load wallet</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error.message || 'Please try refreshing the page'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
} 