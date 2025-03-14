'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight, LineChart, Activity, Bitcoin } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Session } from '@supabase/auth-helpers-nextjs';

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

      return data;
    } catch (error) {
      console.error('Error fetching price data:', error);
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
      setMarkets(data);
      setLastFetchTimes(prev => ({ ...prev, market: Date.now() }));
    } catch (error) {
      console.error('Error fetching market data:', error);
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
      setOverviewData(data);
      setLastFetchTimes(prev => ({ ...prev, overview: Date.now() }));
    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
  }, [shouldFetchData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (shouldFetchData('price')) {
          const pair = getCurrencyPair(selectedCurrency);
          const priceData = await fetchPriceData(pair);
          if (priceData) {
            setPriceData(priceData);
            setLastFetchTimes(prev => ({ ...prev, price: Date.now() }));
          }
        }

        if (shouldFetchData('market')) {
          await fetchMarketData();
        }

        if (shouldFetchData('overview')) {
          await fetchOverviewData();
        }
      } catch (error) {
        console.error('Error in fetch cycle:', error);
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

  const formatNGN = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
    return formatted.replace('NGN', '₦ '); // Add space after ₦
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    let formatted: string;
    
    if (num >= 1e12) {
      formatted = `$ ${(num / 1e12).toFixed(2)} T`;
    } else if (num >= 1e9) {
      formatted = `$ ${(num / 1e9).toFixed(2)} B`;
    } else if (num >= 1e6) {
      formatted = `$ ${(num / 1e6).toFixed(2)} M`;
    } else {
      formatted = `$ ${num.toFixed(2)}`;
    }
    
    return formatted; // Already has space after $
  };

  const formatVolume = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Market Overview Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800/50 shadow-md p-4">
        <h2 className="text-xl font-bold mb-1">Market Overview</h2>
        <p className="text-xs text-muted-foreground mb-3">Real-time cryptocurrency market statistics and trends</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">Total Market Cap</p>
                  <h3 className="text-lg font-bold mt-1">{overviewData?.totalMarketCap || 'Loading...'}</h3>
                </div>
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overviewData?.lastUpdated || 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">24h Trading Volume</p>
                  <h3 className="text-lg font-bold mt-1">{overviewData?.tradingVolume24h || 'Loading...'}</h3>
                </div>
                <LineChart className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overviewData?.lastUpdated || 'Loading...'}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">BTC Dominance</p>
                  <h3 className="text-lg font-bold mt-1">{overviewData?.btcDominance || 'Loading...'}</h3>
                </div>
                <Bitcoin className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overviewData?.lastUpdated || 'Loading...'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Tracker Section */}
      <div className="rounded-lg bg-white dark:bg-gray-800/50 shadow-md p-4">
        <h2 className="text-xl font-bold mb-1">Price Tracker</h2>
        <p className="text-xs text-muted-foreground mb-3">Monitor real-time cryptocurrency prices in NGN</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Tether">Tether</SelectItem>
                <SelectItem value="USD Coin">USD Coin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="lg:col-span-2 bg-purple-50 dark:bg-purple-950/20 border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{priceData?.pair || 'Loading...'}</h3>
                  <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700 text-xs">Live</Badge>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${parseFloat(priceData?.priceChangePercent || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(priceData?.priceChangePercent || '0') >= 0 ? '+' : ''}{parseFloat(priceData?.priceChangePercent || '0')}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vol: {formatVolume(parseFloat(priceData?.volume || '0'))} {selectedCurrency.split(' ')[0]}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold">{priceData?.price || 'Loading...'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 