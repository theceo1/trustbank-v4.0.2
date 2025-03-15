'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MarketDataProps {
  market: string;
}

interface MarketTicker {
  at: number;
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    last: string;
    vol: string;
    change: string;
  };
}

export default function MarketData({ market }: MarketDataProps) {
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const { data: { session } } = await createClientComponentClient().auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const response = await fetch(`/api/markets/${market}/ticker`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTicker(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const formatNumber = (value: string | number, decimals: number = 8) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </>
          ) : ticker ? (
            <>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Last Price</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold"
                >
                  {formatNumber(ticker.ticker.last, 2)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">24h Change</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "text-lg font-semibold flex items-center gap-1",
                    parseFloat(ticker.ticker.change) >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {parseFloat(ticker.ticker.change) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercentage(ticker.ticker.change)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">24h High</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold text-green-600"
                >
                  {formatNumber(ticker.ticker.high, 2)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">24h Low</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold text-red-600"
                >
                  {formatNumber(ticker.ticker.low, 2)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold"
                >
                  {formatNumber(ticker.ticker.vol, 4)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Best Bid</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold text-green-600"
                >
                  {formatNumber(ticker.ticker.buy, 2)}
                </motion.div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Best Ask</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-semibold text-red-600"
                >
                  {formatNumber(ticker.ticker.sell, 2)}
                </motion.div>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
} 