'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SpotOrderForm from '@/components/trade/SpotOrderForm';
import OrderBook from '@/components/trade/OrderBook';
import { useTheme } from 'next-themes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MARKETS = [
  { value: 'usdtngn', label: 'USDT/NGN', base: 'USDT', quote: 'NGN' },
  { value: 'btcngn', label: 'BTC/NGN', base: 'BTC', quote: 'NGN' },
  { value: 'ethngn', label: 'ETH/NGN', base: 'ETH', quote: 'NGN' },
  { value: 'btcusdt', label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
  { value: 'ethusdt', label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
];

export default function SpotTradingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [lastPrice, setLastPrice] = useState('0');
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [volume24h, setVolume24h] = useState('0');
  const [loading, setLoading] = useState(true);
  useTheme();

  useEffect(() => {
    if (!user && !authLoading && !profileLoading) {
      router.push('/auth/login');
    }
  }, [user, authLoading, profileLoading, router]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedMarket.value]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/markets/${selectedMarket.value}/ticker`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch market data');
      }
      
      if (data.ticker) {
        setLastPrice(data.ticker.last);
        setPriceChange24h(parseFloat(data.ticker.price_change_percent));
        setVolume24h(data.ticker.volume);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLastPrice('0');
      setPriceChange24h(0);
      setVolume24h('0');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string | number, decimals: number = 8) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please <Link href="/auth/login" className="text-green-600 hover:text-green-700 underline">log in</Link> to access trading features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="default" className="border-green-600/20 bg-green-50 dark:bg-green-900/10">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-300">Verification Required</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Please complete your KYC verification to start trading. <Link href="/profile/verification" className="underline">Click here to verify</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Market Selection and Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="col-span-1 md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Select
                  value={selectedMarket.value}
                  onValueChange={(value) => {
                    const market = MARKETS.find(m => m.value === value);
                    if (market) setSelectedMarket(market);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETS.map((market) => (
                      <SelectItem key={market.value} value={market.value}>
                        <div className="flex items-center">
                          <ArrowLeftRight className="w-4 h-4 mr-2 text-muted-foreground" />
                          {market.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatNumber(lastPrice, 2)} {selectedMarket.quote}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    priceChange24h >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">24h Volume</div>
                <div className="text-lg font-medium">
                  {formatNumber(volume24h, 2)} {selectedMarket.base}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Market Status</div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-lg font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface */}
        <div className="grid grid-cols-12 gap-6">
          {/* Order Form */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
              </CardHeader>
              <CardContent>
                <SpotOrderForm
                  market={selectedMarket.value}
                  baseAsset={selectedMarket.base}
                  quoteAsset={selectedMarket.quote}
                  lastPrice={lastPrice}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Book */}
          <div className="col-span-12 lg:col-span-6">
            <OrderBook market={selectedMarket.value} />
          </div>
        </div>
      </motion.div>
    </div>
  );
} 