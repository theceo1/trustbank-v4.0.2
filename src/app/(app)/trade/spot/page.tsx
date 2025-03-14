'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MARKETS = [
  { value: 'usdtngn', label: 'USDT/NGN', base: 'USDT', quote: 'NGN' },
  { value: 'btcngn', label: 'BTC/NGN', base: 'BTC', quote: 'NGN' },
  { value: 'ethngn', label: 'ETH/NGN', base: 'ETH', quote: 'NGN' },
  { value: 'btcusdt', label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
  { value: 'ethusdt', label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
];

// Create motion components at the top level
const MotionDiv = motion.create('div');

export default function SpotTradingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [selectedMarket, setSelectedMarket] = useState('btcusdt');
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<string | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for market data loading
  const [marketDataLoading, setMarketDataLoading] = useState(false);

  const markets = [
    { value: 'btcusdt', label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
    { value: 'ethusdt', label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
  ];

  useTheme();

  const fetchMarketData = useCallback(async () => {
    try {
      setMarketDataLoading(true);
      console.log('Fetching market data for:', selectedMarket);

      const response = await fetch(`/api/markets/${selectedMarket}/ticker`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch market data');
      }

      console.log('Market data received:', data);

      if (data.status === 'success' && data.data) {
        setLastPrice(data.data.price);
        setPriceChange24h(data.data.priceChangePercent);
        setVolume24h(data.data.volume);
        setError(null);
      } else {
        throw new Error('Invalid market data format');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError('Failed to fetch market data. Please try again.');
    } finally {
      setMarketDataLoading(false);
    }
  }, [selectedMarket]);

  useEffect(() => {
    console.log('Auth state:', { user, authLoading, profile, profileLoading });

    // Only show loading state while auth and profile are loading
    if (authLoading || profileLoading) {
      setLoading(true);
      return;
    }

    // Check authentication and KYC status
    if (!user) {
      router.push('/auth/login?redirect=/trade/spot');
      return;
    }

    setLoading(false);

    // Show KYC verification alert if needed
    if (!profile?.kyc_verified) {
      setError('Please complete KYC verification to trade.');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Start fetching market data
    fetchMarketData();
  }, [user, authLoading, profile, profileLoading, router, fetchMarketData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startFetching = () => {
      // Only fetch if user is authenticated and KYC verified
      if (!user || !profile?.kyc_verified) {
        return;
      }

      // Initial fetch
      fetchMarketData();

      // Set up interval for subsequent fetches
      intervalId = setInterval(fetchMarketData, 5000);
    };

    startFetching();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, profile, fetchMarketData]);

  const formatNumber = (value: string | number, decimals: number = 8) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to access the trading features.</AlertDescription>
      </Alert>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <Alert variant="default" className="mb-4 border-yellow-600/20 bg-yellow-50 dark:bg-yellow-900/10">
        <Info className="h-4 w-4" />
        <AlertTitle>KYC Verification Required</AlertTitle>
        <AlertDescription>
          Please complete your KYC verification to start trading.
          <Button variant="link" asChild className="p-0 h-auto font-normal">
            <Link href="/settings/kyc">Complete KYC</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-4">
        <Select
          value={selectedMarket}
          onValueChange={setSelectedMarket}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select market" />
          </SelectTrigger>
          <SelectContent>
            {markets.map((market) => (
              <SelectItem key={market.value} value={market.value}>
                {market.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {marketDataLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            {lastPrice && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{lastPrice}</span>
                {priceChange24h && (
                  <Badge variant={parseFloat(priceChange24h) >= 0 ? "default" : "destructive"} className={parseFloat(priceChange24h) >= 0 ? "bg-green-500 hover:bg-green-600" : ""}>
                    {parseFloat(priceChange24h) >= 0 ? '+' : ''}{priceChange24h}%
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add your trading interface components here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order form */}
        <Card>
          <CardHeader>
            <CardTitle>Place Order</CardTitle>
          </CardHeader>
          <CardContent>
            <SpotOrderForm
              market={selectedMarket}
              baseAsset={MARKETS.find(m => m.value === selectedMarket)?.base || ''}
              quoteAsset={MARKETS.find(m => m.value === selectedMarket)?.quote || ''}
              lastPrice={lastPrice || '0'}
            />
          </CardContent>
        </Card>

        {/* Order book */}
        <Card>
          <CardHeader>
            <CardTitle>Order Book</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderBook market={selectedMarket} />
          </CardContent>
        </Card>
      </div>
    </MotionDiv>
  );
} 