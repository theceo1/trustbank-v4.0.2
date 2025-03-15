'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import SpotOrderForm from '@/components/trade/SpotOrderForm';
import OrderBook from '@/components/trade/OrderBook';
import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const MARKETS = [
  { value: 'usdtngn', label: 'USDT/NGN', base: 'USDT', quote: 'NGN' },
  { value: 'btcngn', label: 'BTC/NGN', base: 'BTC', quote: 'NGN' },
  { value: 'ethngn', label: 'ETH/NGN', base: 'ETH', quote: 'NGN' },
  { value: 'btcusdt', label: 'BTC/USDT', base: 'BTC', quote: 'USDT' },
  { value: 'ethusdt', label: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
];

export default function SpotTradingPage() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0].value);
  const [marketDataLoading, setMarketDataLoading] = useState(true);
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch(`/api/markets/${selectedMarket}/ticker`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch market data');

        const data = await response.json();
        setLastPrice(data.last);
        setPriceChange24h(data.price_change_percent);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setMarketDataLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedMarket, supabase]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-4">
        <Select
          value={selectedMarket}
          onValueChange={setSelectedMarket}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select market" />
          </SelectTrigger>
          <SelectContent>
            {MARKETS.map((market) => (
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
    </motion.div>
  );
} 