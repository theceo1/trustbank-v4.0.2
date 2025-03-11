'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

export default function MarketPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
      try {
      setLoading(true);
        const response = await fetch('/api/markets/tickers');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Validate the data structure
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

  const calculateChange = (open: string, last: string): number => {
    const openPrice = parseFloat(open);
    const lastPrice = parseFloat(last);
    if (isNaN(openPrice) || isNaN(lastPrice) || openPrice === 0) return 0;
    return ((lastPrice - openPrice) / openPrice) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Markets</h1>
        <Button asChild>
          <Link href="/trade">
            Start Trading
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
              <CardContent className="h-32 bg-muted" />
            </Card>
          ))
        ) : (
          markets.map((market) => (
            <Link key={market.pair} href={`/trade/${market.pair.toLowerCase()}`}>
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{market.pair}</span>
                    <Badge
                      variant={market.change24h >= 0 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {market.change24h >= 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {Math.abs(market.change24h).toFixed(2)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold">{market.lastPrice}</p>
                      <p className="text-sm text-muted-foreground">Last Price</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{market.high24h}</p>
                        <p className="text-sm text-muted-foreground">24h High</p>
                      </div>
                      <div>
                        <p className="font-medium">{market.low24h}</p>
                        <p className="text-sm text-muted-foreground">24h Low</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 