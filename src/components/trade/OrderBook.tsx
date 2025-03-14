'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Order {
  price: string;
  amount: string;
  total: string;
}

interface OrderBookProps {
  market: string;
}

export default function OrderBook({ market }: OrderBookProps) {
  const [asks, setAsks] = useState<Order[]>([]);
  const [bids, setBids] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'both' | 'buy' | 'sell'>('both');

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [market]);

  const fetchOrderBook = async () => {
    try {
      const { data: { session } } = await createClientComponentClient().auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const response = await fetch(`/api/markets/${market}/order-book`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order book');
      }
      const data = await response.json();

      if (data.asks && data.bids) {
        // Process asks (sell orders)
        const processedAsks = data.asks.map((ask: [string, string]) => ({
          price: ask[0],
          amount: ask[1],
          total: (parseFloat(ask[0]) * parseFloat(ask[1])).toString()
        })).slice(0, 10); // Show top 10 asks

        // Process bids (buy orders)
        const processedBids = data.bids.map((bid: [string, string]) => ({
          price: bid[0],
          amount: bid[1],
          total: (parseFloat(bid[0]) * parseFloat(bid[1])).toString()
        })).slice(0, 10); // Show top 10 bids

        setAsks(processedAsks);
        setBids(processedBids);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching order book:', err);
      setError('Failed to load order book');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string | number, decimals: number = 8) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const OrderRow = ({ order, type }: { order: Order; type: 'ask' | 'bid' }) => (
    <motion.div
      initial={{ opacity: 0, x: type === 'ask' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'grid grid-cols-3 text-sm py-1 px-2 rounded cursor-pointer transition-colors',
        type === 'ask' 
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
      )}
    >
      <span>{formatNumber(order.price, 2)}</span>
      <span className="text-center">{formatNumber(order.amount, 4)}</span>
      <span className="text-right">{formatNumber(order.total, 2)}</span>
    </motion.div>
  );

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as 'both' | 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="both">Both</TabsTrigger>
            <TabsTrigger value="buy">Buy Orders</TabsTrigger>
            <TabsTrigger value="sell">Sell Orders</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {/* Column Headers */}
            <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium">
              <span>Price</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Total</span>
            </div>

            {error ? (
              <div className="text-center text-sm text-red-500 py-4">{error}</div>
            ) : loading ? (
              <div className="text-center text-sm text-muted-foreground py-4">Loading...</div>
            ) : (
              <>
                {(view === 'both' || view === 'sell') && (
                  <div className="space-y-1">
                    {asks.map((ask, index) => (
                      <OrderRow key={`ask-${index}`} order={ask} type="ask" />
                    ))}
                  </div>
                )}

                {view === 'both' && (
                  <div className="border-t border-dashed dark:border-gray-700 my-2" />
                )}

                {(view === 'both' || view === 'buy') && (
                  <div className="space-y-1">
                    {bids.map((bid, index) => (
                      <OrderRow key={`bid-${index}`} order={bid} type="bid" />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 