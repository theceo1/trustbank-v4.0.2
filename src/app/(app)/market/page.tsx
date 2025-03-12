'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight, LineChart, Activity, Bitcoin } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MarketTicker {
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
    last: string;
    vol: string;
  };
}

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

export default function MarketPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [overview, setOverview] = useState<MarketOverview>({
    totalMarketCap: '$1.95T',
    tradingVolume24h: 'Loading...',
    btcDominance: '82.7%',
    lastUpdated: '1:49:03 PM'
  });
  const [selectedCurrency, setSelectedCurrency] = useState('Bitcoin');
  const [priceData, setPriceData] = useState<PriceData>({
    pair: 'BTC/NGN',
    price: '0',
    priceChangePercent: '0',
    volume: '0',
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<{[key: string]: number}>({
    market: 0,
    overview: 0,
    price: 0
  });

  const CACHE_DURATION = {
    market: 30000,    // 30 seconds
    overview: 30000,  // 30 seconds
    price: 5000      // 5 seconds
  };

  const shouldFetchData = (type: 'market' | 'overview' | 'price') => {
    const now = Date.now();
    return now - (lastFetchTime[type] || 0) >= CACHE_DURATION[type];
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        if (shouldFetchData('market')) {
          await fetchMarketData();
          setLastFetchTime(prev => ({ ...prev, market: Date.now() }));
        }
        if (shouldFetchData('overview')) {
          await fetchOverviewData();
          setLastFetchTime(prev => ({ ...prev, overview: Date.now() }));
        }
        if (shouldFetchData('price')) {
          await fetchPriceData(getCurrencyPair(selectedCurrency));
          setLastFetchTime(prev => ({ ...prev, price: Date.now() }));
        }
      } catch (error) {
        console.error('Error in fetch cycle:', error);
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up interval for subsequent fetches
    intervalId = setInterval(fetchData, 5000); // Check every 5 seconds
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedCurrency]);

  const getCurrencyPair = (currency: string): string => {
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
  };

  const fetchPriceData = async (pair: string) => {
    try {
      const response = await fetch(`/api/markets/price?pair=${pair}`, {
        // Add cache control headers
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

      setPriceData({
        pair: data.data.pair.replace('NGN', '/NGN'),
        price: formatNGN(data.data.price),
        priceChangePercent: data.data.priceChangePercent,
        volume: data.data.volume,
        lastUpdated: data.data.lastUpdated
      });
    } catch (error) {
      console.error('Error fetching price data:', error);
      // Don't update state on error to keep previous valid data
    }
  };

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

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/markets/tickers');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid market data format');
      }

      const entries = Object.entries(data) as [string, unknown][];
      
      const processedData = entries
        .filter((entry): entry is [string, MarketTicker] => {
          const [_, details] = entry;
          return details !== null &&
                 typeof details === 'object' &&
                 'ticker' in details &&
                 typeof (details as any).ticker === 'object' &&
                 'last' in (details as any).ticker &&
                 'open' in (details as any).ticker &&
                 'high' in (details as any).ticker &&
                 'low' in (details as any).ticker &&
                 'vol' in (details as any).ticker;
        })
        .map(([pair, details]) => ({
          pair: pair.toUpperCase(),
          lastPrice: details.ticker.last,
          change24h: calculateChange(details.ticker.open, details.ticker.last),
          high24h: details.ticker.high,
          low24h: details.ticker.low,
          volume24h: details.ticker.vol,
        }));

      if (processedData.length === 0) {
        throw new Error('No valid market data available');
      }

      setMarkets(processedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewData = async () => {
    try {
      const response = await fetch('/api/markets/overview');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setOverview({
        totalMarketCap: formatCurrency(data.data.totalMarketCap),
        tradingVolume24h: formatCurrency(data.data.tradingVolume24h),
        btcDominance: `${data.data.btcDominance}%`,
        lastUpdated: data.data.lastUpdated
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
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

  const calculateChange = (open: string, last: string): number => {
    const openPrice = parseFloat(open);
    const lastPrice = parseFloat(last);
    if (isNaN(openPrice) || isNaN(lastPrice) || openPrice === 0) return 0;
    return ((lastPrice - openPrice) / openPrice) * 100;
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
                  <h3 className="text-lg font-bold mt-1">{overview.totalMarketCap}</h3>
                </div>
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overview.lastUpdated}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">24h Trading Volume</p>
                  <h3 className="text-lg font-bold mt-1">{overview.tradingVolume24h}</h3>
                </div>
                <LineChart className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overview.lastUpdated}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">BTC Dominance</p>
                  <h3 className="text-lg font-bold mt-1">{overview.btcDominance}</h3>
                </div>
                <Bitcoin className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Last updated: {overview.lastUpdated}</p>
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
                  <h3 className="text-lg font-semibold">{priceData.pair}</h3>
                  <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700 text-xs">Live</Badge>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${parseFloat(priceData.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(priceData.priceChangePercent) >= 0 ? '+' : ''}{priceData.priceChangePercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vol: {formatVolume(parseFloat(priceData.volume))} {selectedCurrency.split(' ')[0]}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold">{priceData.price}</p>
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