'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

interface Order {
  price: string;
  volume: string;
  total?: string;
}

interface OrderBookData {
  asks: Order[];
  bids: Order[];
  timestamp: string;
}

const MAX_ORDERS_TO_DISPLAY = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function OrderBook({ market }: { market: string }) {
  const [asks, setAsks] = useState<Order[]>([]);
  const [bids, setBids] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxTotal, setMaxTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('both');
  const [retryCount, setRetryCount] = useState(0);

  // Fix currency pair parsing
  const [baseAsset, quoteAsset] = market.toUpperCase().split(/(?<=^.{4})/);
  // Example: "USDTNGN" becomes ["USDT", "NGN"]

  const fetchOrderBook = useCallback(async (retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/markets/${market}/order-book`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order book');
      }

      const data: OrderBookData = await response.json();

      if (!data || !Array.isArray(data.asks) || !Array.isArray(data.bids)) {
        throw new Error('Invalid order book data format');
      }

      // Process asks and bids to calculate running totals
      const processedAsks = data.asks.map((ask, index, array) => {
        const volume = parseFloat(ask.volume);
        const total = array
          .slice(0, index + 1)
          .reduce((sum, curr) => sum + parseFloat(curr.volume), 0)
          .toString();
        return { ...ask, total };
      });

      const processedBids = data.bids.map((bid, index, array) => {
        const volume = parseFloat(bid.volume);
        const total = array
          .slice(0, index + 1)
          .reduce((sum, curr) => sum + parseFloat(curr.volume), 0)
          .toString();
        return { ...bid, total };
      });

      // Calculate max total for visualization
      const maxAskTotal = processedAsks.length > 0 
        ? Math.max(...processedAsks.map(ask => parseFloat(ask.total || '0')))
        : 0;
      const maxBidTotal = processedBids.length > 0
        ? Math.max(...processedBids.map(bid => parseFloat(bid.total || '0')))
        : 0;
      setMaxTotal(Math.max(maxAskTotal, maxBidTotal));

      setAsks(processedAsks);
      setBids(processedBids);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching order book:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order book';
      
      // Implement retry logic
      if (retryAttempt < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryAttempt + 1} of ${MAX_RETRIES}`);
        setTimeout(() => {
          fetchOrderBook(retryAttempt + 1);
        }, RETRY_DELAY);
        setRetryCount(retryAttempt + 1);
      } else {
        setError(errorMessage);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  if (loading && !asks.length && !bids.length) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          onClick={() => fetchOrderBook()}
          className="w-full"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  const OrderRow = ({ order, side }: { order: Order; side: 'ask' | 'bid' }) => {
    const total = parseFloat(order.total || '0');
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative grid grid-cols-3 gap-2 py-0.5 text-sm"
      >
        <div
          className={`absolute inset-0 ${
            side === 'ask' ? 'bg-red-500/10' : 'bg-green-500/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
        <span className={side === 'ask' ? 'text-red-500' : 'text-green-500'}>
          {formatNumber(parseFloat(order.price), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span>{formatNumber(parseFloat(order.volume), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{formatNumber(total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </motion.div>
    );
  };

  const limitedAsks = asks.slice(0, MAX_ORDERS_TO_DISPLAY);
  const limitedBids = bids.slice(0, MAX_ORDERS_TO_DISPLAY);

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{baseAsset}/{quoteAsset} Order Book</h3>
        <p className="text-sm text-muted-foreground">Price in {quoteAsset}, Amount in {baseAsset}</p>
      </div>

      {retryCount > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Reconnecting... Attempt {retryCount} of {MAX_RETRIES}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
          <TabsTrigger value="both">Both</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
          <span>Price ({quoteAsset})</span>
          <span>Amount ({baseAsset})</span>
          <span>Total ({quoteAsset})</span>
        </div>

        <TabsContent value="sell" className="space-y-1">
          {limitedAsks.length > 0 ? (
            limitedAsks.map((ask, i) => (
              <OrderRow key={`ask-${i}`} order={ask} side="ask" />
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm">No sell orders</div>
          )}
        </TabsContent>

        <TabsContent value="buy" className="space-y-1">
          {limitedBids.length > 0 ? (
            limitedBids.map((bid, i) => (
              <OrderRow key={`bid-${i}`} order={bid} side="bid" />
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm">No buy orders</div>
          )}
        </TabsContent>

        <TabsContent value="both" className="space-y-1">
          <div className="mb-2">
            <div className="text-xs font-medium text-red-500 mb-1">Sell Orders</div>
            {limitedAsks.length > 0 ? (
              limitedAsks.map((ask, i) => (
                <OrderRow key={`ask-${i}`} order={ask} side="ask" />
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm">No sell orders</div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

          <div>
            <div className="text-xs font-medium text-green-500 mb-1">Buy Orders</div>
            {limitedBids.length > 0 ? (
              limitedBids.map((bid, i) => (
                <OrderRow key={`bid-${i}`} order={bid} side="bid" />
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm">No buy orders</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 