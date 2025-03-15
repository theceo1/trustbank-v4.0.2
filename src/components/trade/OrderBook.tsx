'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

export default function OrderBook({ market }: { market: string }) {
  const [asks, setAsks] = useState<Order[]>([]);
  const [bids, setBids] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxTotal, setMaxTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('both');

  const fetchOrderBook = async () => {
    try {
      const response = await fetch(`/api/markets/${market}/order-book`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order book');
      }

      const data: OrderBookData = await response.json();

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
    } catch (err) {
      console.error('Error fetching order book:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order book');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [market]);

  if (loading) {
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
        <Alert variant="destructive">
          {error}
        </Alert>
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
          {parseFloat(order.price).toFixed(2)}
        </span>
        <span>{parseFloat(order.volume).toFixed(4)}</span>
        <span>{total.toFixed(4)}</span>
      </motion.div>
    );
  };

  const limitedAsks = asks.slice(0, MAX_ORDERS_TO_DISPLAY);
  const limitedBids = bids.slice(0, MAX_ORDERS_TO_DISPLAY);

  return (
    <Card className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
          <TabsTrigger value="both">Both</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
          <span>Price</span>
          <span>Amount</span>
          <span>Total</span>
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
          {limitedAsks.length > 0 ? (
            limitedAsks.map((ask, i) => (
              <OrderRow key={`ask-${i}`} order={ask} side="ask" />
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm">No sell orders</div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-800 my-2" />

          {limitedBids.length > 0 ? (
            limitedBids.map((bid, i) => (
              <OrderRow key={`bid-${i}`} order={bid} side="bid" />
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm">No buy orders</div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
} 