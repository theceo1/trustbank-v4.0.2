'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatMarketCap, formatCurrency, formatCompactNumber } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banner } from '@/components/Banner';
import { motion } from 'framer-motion';

interface MarketData {
  totalMarketCap: number;
  tradingVolume24h: number;
  btcDominance: number;
  lastUpdated: string;
}

interface PriceData {
  [key: string]: {
    price: number;
    volume: number;
    change24h: number;
  };
}

type CurrencyKey = 'USDT' | 'BTC' | 'ETH';

const CURRENCIES: Record<CurrencyKey, { color: string }> = {
  USDT: { color: 'from-green-500/20 to-green-500/5' },
  BTC: { color: 'from-orange-500/20 to-orange-500/5' },
  ETH: { color: 'from-blue-500/20 to-blue-500/5' },
};

const INITIAL_MARKET_DATA: MarketData = {
  totalMarketCap: 0,
  tradingVolume24h: 0,
  btcDominance: 0,
  lastUpdated: new Date().toISOString()
};

const INITIAL_PRICE_DATA: PriceData = {
  USDT: { price: 0, volume: 0, change24h: 0 },
  BTC: { price: 0, volume: 0, change24h: 0 },
  ETH: { price: 0, volume: 0, change24h: 0 }
};

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData>(INITIAL_MARKET_DATA);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyKey>('USDT');
  const [priceData, setPriceData] = useState<PriceData>(INITIAL_PRICE_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch market overview data
      const overviewResponse = await fetch('/api/markets/overview');
      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch market data');
      }
      const overviewData = await overviewResponse.json();
      
      if (overviewData.status === 'success') {
        setMarketData(overviewData.data);
      }

      // Fetch tickers for price data
      const tickersResponse = await fetch('/api/markets/tickers');
      if (!tickersResponse.ok) {
        throw new Error('Failed to fetch tickers');
      }
      const tickersData = await tickersResponse.json();

      // Process tickers data
      const newPriceData: PriceData = {
        USDT: { price: 0, volume: 0, change24h: 0 },
        BTC: { price: 0, volume: 0, change24h: 0 },
        ETH: { price: 0, volume: 0, change24h: 0 }
      };

      if (tickersData.status === 'success') {
        const tickers = tickersData.data;
        Object.entries(tickers).forEach(([pair, data]: [string, any]) => {
          if (pair === 'usdtngn') {
            newPriceData.USDT.price = parseFloat(data.ticker.last);
            newPriceData.USDT.volume = parseFloat(data.ticker.vol);
            newPriceData.USDT.change24h = parseFloat(data.ticker.change || '0');
          } else if (pair === 'btcngn') {
            newPriceData.BTC.price = parseFloat(data.ticker.last);
            newPriceData.BTC.volume = parseFloat(data.ticker.vol);
            newPriceData.BTC.change24h = parseFloat(data.ticker.change || '0');
          } else if (pair === 'ethngn') {
            newPriceData.ETH.price = parseFloat(data.ticker.last);
            newPriceData.ETH.volume = parseFloat(data.ticker.vol);
            newPriceData.ETH.change24h = parseFloat(data.ticker.change || '0');
          }
        });
      }

      setPriceData(newPriceData);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Format the last updated time in a consistent way that won't cause hydration issues
  const formattedTime = new Date(marketData.lastUpdated).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'  // Use UTC to ensure consistency between server and client
  });

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
              <div className="text-2xl font-bold">{formatMarketCap(marketData.totalMarketCap)}</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {formattedTime}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg p-6 bg-gradient-to-r from-blue-500/20 to-blue-500/5"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-2">24h Trading Volume</h3>
              <div className="text-2xl font-bold">{formatMarketCap(marketData.tradingVolume24h)}</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {formattedTime}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-lg p-6 bg-gradient-to-r from-orange-500/20 to-orange-500/5"
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-2">BTC Dominance</h3>
              <div className="text-2xl font-bold">{marketData.btcDominance.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-2">Last updated: {formattedTime}</p>
            </motion.div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Price Tracker</h2>
                <p className="text-muted-foreground">Monitor real-time cryptocurrency prices in NGN</p>
              </div>

              <Select 
                value={selectedCurrency} 
                onValueChange={(value: CurrencyKey) => setSelectedCurrency(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCIES) as CurrencyKey[]).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg p-6 bg-gradient-to-r ${CURRENCIES[selectedCurrency].color}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{selectedCurrency}/NGN</h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">Live</span>
                </div>

                <div className="flex items-end gap-4">
                  <div className="text-4xl font-bold">
                    {formatCurrency(priceData[selectedCurrency].price, 'NGN')}
                  </div>
                  <div className={`text-sm px-2 py-1 rounded ${
                    priceData[selectedCurrency].change24h >= 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {priceData[selectedCurrency].change24h >= 0 ? '+' : ''}
                    {priceData[selectedCurrency].change24h.toFixed(2)}%
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Vol: {formatCompactNumber(priceData[selectedCurrency].volume)} {selectedCurrency}
                </div>
              </div>
            </motion.div>
          </div>
        </Card>
      </div>
    </>
  );
} 