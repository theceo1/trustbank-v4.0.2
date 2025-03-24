'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatMarketCap, formatCurrency, formatCompactNumber, formatNumber } from '@/lib/utils';
import { Banner } from '@/components/Banner';
import { motion } from 'framer-motion';

interface MarketData {
  total_market_cap: number;
  trading_volume_24h: number;
  btc_dominance: number;
  btc_price: number;
  eth_price: number;
  markets: {
    [key: string]: {
      last: string;
      vol: string;
      buy: string;
      sell: string;
      low: string;
      high: string;
      open: string;
    } | null;
  };
}

// Group currencies by category for better organization
const CURRENCY_GROUPS = {
  'Popular': ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'],
  'DeFi': ['AAVE', 'CAKE', 'LINK'],
  'Layer 1': ['ADA', 'DOT', 'AVAX', 'FTM', 'NEAR', 'ATOM'],
  'Meme': ['DOGE', 'SHIB'],
  'Layer 2': ['MATIC'],
  'Other': ['XRP']
} as const;

type CurrencyGroup = keyof typeof CURRENCY_GROUPS;
type Currency = typeof CURRENCY_GROUPS[CurrencyGroup][number];

interface CurrencyInfo {
  label: string;
  icon: string;
}

const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  USDT: { label: 'Tether', icon: '💵' },
  BTC: { label: 'Bitcoin', icon: '₿' },
  ETH: { label: 'Ethereum', icon: 'Ξ' },
  BNB: { label: 'Binance Coin', icon: '🟡' },
  SOL: { label: 'Solana', icon: '◎' },
  MATIC: { label: 'Polygon', icon: '⬡' },
  DOGE: { label: 'Dogecoin', icon: 'Ð' },
  SHIB: { label: 'Shiba Inu', icon: '🐕' },
  XRP: { label: 'Ripple', icon: '✕' },
  ADA: { label: 'Cardano', icon: '₳' },
  DOT: { label: 'Polkadot', icon: '●' },
  LINK: { label: 'Chainlink', icon: '⬡' },
  AAVE: { label: 'Aave', icon: '👻' },
  CAKE: { label: 'PancakeSwap', icon: '🥞' },
  FTM: { label: 'Fantom', icon: '👻' },
  AVAX: { label: 'Avalanche', icon: '🔺' },
  ATOM: { label: 'Cosmos', icon: '⚛' },
  NEAR: { label: 'NEAR Protocol', icon: 'Ⓝ' }
};

const INITIAL_MARKET_DATA: MarketData = {
  total_market_cap: 0,
  trading_volume_24h: 0,
  btc_dominance: 0,
  btc_price: 0,
  eth_price: 0,
  markets: {}
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData>(INITIAL_MARKET_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch market overview data
      const overviewResponse = await fetch('/api/markets/overview');
      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch market data');
      }
      const overviewData = await overviewResponse.json();
      
      if (overviewData.success) {
        setMarketData(overviewData.data);
      } else {
        throw new Error(overviewData.message || 'Failed to fetch market data');
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Market Data</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchMarketData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Banner />
      <div className="space-y-8 p-6">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Market Overview</h1>
            <p className="text-muted-foreground">Real-time cryptocurrency market statistics and trends</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg p-6 bg-gradient-to-r from-purple-500/20 to-purple-500/5"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Market Cap</h3>
              <div className="text-2xl font-bold">{formatMarketCap(marketData.total_market_cap)}</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg p-6 bg-gradient-to-r from-blue-500/20 to-blue-500/5"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-2">24h Trading Volume</h3>
              <div className="text-2xl font-bold">{formatMarketCap(marketData.trading_volume_24h)}</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg p-6 bg-gradient-to-r from-orange-500/20 to-orange-500/5"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-2">BTC Dominance</h3>
              <div className="text-2xl font-bold">{marketData.btc_dominance.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
            </motion.div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Price Tracker</h2>
              <p className="text-muted-foreground">Monitor real-time cryptocurrency prices in USDT</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(CURRENCY_INFO) as [Currency, CurrencyInfo][]).map(([currency, info]) => {
                const marketKey = currency === 'USDT' ? 'USDT/USD' : `${currency}/USDT`;
                const market = marketData.markets[marketKey.toLowerCase()];
                
                return (
                  <Card
                    key={currency}
                    className={`relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-semibold">{currency}</h3>
                          <p className="text-sm text-muted-foreground">{info.label}</p>
                        </div>
                      </div>
                      
                      {market ? (
                        <div className="space-y-2">
                          <div className="text-2xl font-bold">
                            ${formatPrice(parseFloat(market.last))}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Vol: </span>
                              ${formatPrice(parseFloat(market.vol))}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">24h: </span>
                              <span className={parseFloat(market.last) > parseFloat(market.open) ? 'text-green-600' : 'text-red-600'}>
                                {formatPrice(((parseFloat(market.last) - parseFloat(market.open)) / parseFloat(market.open)) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No data available</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
} 