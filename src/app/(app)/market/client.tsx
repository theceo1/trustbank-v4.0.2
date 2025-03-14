'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight, LineChart, Activity, Bitcoin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Session } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface MarketData {
  pair: string;
  lastPrice: string;
  change24h: number;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface MarketOverview {
  totalMarketCap: string;
  tradingVolume24h: string;
  btcDominance: string;
  lastUpdated: string;
}

interface PriceData {
  pair: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  lastUpdated: string;
}

interface MarketClientProps {
  session: Session | null;
}

export function MarketClient({ session }: MarketClientProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('Bitcoin');
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [overviewData, setOverviewData] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTimes, setLastFetchTimes] = useState<Record<string, number>>({});

  const shouldFetchData = useCallback((type: 'market' | 'overview' | 'price') => {
    const lastFetch = lastFetchTimes[type];
    if (!lastFetch) return true;
    const now = Date.now();
    return now - lastFetch > 30000; // 30 seconds
  }, [lastFetchTimes]);

  const getCurrencyPair = useCallback((currency: string): string => {
    switch (currency) {
      case 'Bitcoin':
        return 'btcngn';
      case 'Ethereum':
        return 'ethngn';
      case 'Tether':
        return 'usdtngn';
      case 'USD Coin':
        return 'usdcngn';
      default:
        return 'btcngn';
    }
  }, []);

  const fetchPriceData = useCallback(async (pair: string) => {
    try {
      const response = await fetch(`/api/markets/price?pair=${pair}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching price data:', error);
      toast.error('Failed to fetch price data');
      return null;
    }
  }, []);

  const fetchMarketData = useCallback(async () => {
    if (!shouldFetchData('market')) return;

    try {
      const response = await fetch('/api/markets/data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setMarkets(data);
      setLastFetchTimes(prev => ({ ...prev, market: Date.now() }));
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Failed to fetch market data');
    }
  }, [shouldFetchData]);

  const fetchOverviewData = useCallback(async () => {
    if (!shouldFetchData('overview')) return;

    try {
      const response = await fetch('/api/markets/overview');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setOverviewData(data.data);
      setLastFetchTimes(prev => ({ ...prev, overview: Date.now() }));
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Failed to fetch overview data');
    }
  }, [shouldFetchData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchPromises = [];
        
        if (shouldFetchData('price')) {
          const pair = getCurrencyPair(selectedCurrency);
          fetchPromises.push(
            fetchPriceData(pair).then(data => {
              if (data) {
                setPriceData(data);
                setLastFetchTimes(prev => ({ ...prev, price: Date.now() }));
              }
            })
          );
        }

        if (shouldFetchData('market')) {
          fetchPromises.push(fetchMarketData());
        }

        if (shouldFetchData('overview')) {
          fetchPromises.push(fetchOverviewData());
        }

        await Promise.all(fetchPromises);
      } catch (error) {
        console.error('Error in fetch cycle:', error);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up interval for subsequent fetches
    const intervalId = setInterval(fetchData, 30000); // Check every 30 seconds
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedCurrency, shouldFetchData, fetchMarketData, fetchOverviewData, fetchPriceData, getCurrencyPair]);

  const formatMarketCap = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return formatNumber(num, { maximumFractionDigits: 2 });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Market Overview Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800/50 shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">Market Overview</h2>
        <p className="text-sm text-muted-foreground mb-6">Real-time cryptocurrency market statistics and trends</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-muted-foreground">Total Market Cap</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      formatMarketCap(overviewData?.totalMarketCap || '0')
                    )}
                  </h3>
                </div>
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {overviewData?.lastUpdated || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-muted-foreground">24h Trading Volume</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      formatMarketCap(overviewData?.tradingVolume24h || '0')
                    )}
                  </h3>
                </div>
                <LineChart className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {overviewData?.lastUpdated || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-muted-foreground">BTC Dominance</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${overviewData?.btcDominance || '0'}%`
                    )}
                  </h3>
                </div>
                <Bitcoin className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last updated: {overviewData?.lastUpdated || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Tracker Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800/50 shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">Price Tracker</h2>
        <p className="text-sm text-muted-foreground mb-6">Monitor real-time cryptocurrency prices in NGN</p>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                <SelectItem value="Ethereum">Ethereum (ETH)</SelectItem>
                <SelectItem value="Tether">Tether (USDT)</SelectItem>
                <SelectItem value="USD Coin">USD Coin (USDC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{getCurrencyPair(selectedCurrency)}</h3>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    formatCurrency(priceData?.price || '0', 'NGN')
                  )}
                </span>
                {priceData?.priceChangePercent && (
                  <Badge 
                    variant={parseFloat(priceData.priceChangePercent) >= 0 ? "default" : "destructive"}
                    className={parseFloat(priceData.priceChangePercent) >= 0 ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {parseFloat(priceData.priceChangePercent) >= 0 ? '+' : ''}{priceData.priceChangePercent}%
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Vol: {formatVolume(priceData?.volume || '0')} {selectedCurrency}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 