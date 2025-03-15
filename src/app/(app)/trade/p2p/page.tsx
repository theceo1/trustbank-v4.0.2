'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { type SupportedCurrency } from '@/lib/types';
import { useSupabase } from '@/lib/providers/supabase-provider';

interface P2POrder {
  id: string;
  creator_id: string;
  type: 'buy' | 'sell';
  currency: SupportedCurrency;
  price: string;
  amount: string;
  min_order: string;
  max_order: string;
  payment_methods: string[];
  terms: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_trades: number;
  completion_rate: number;
  creator: {
    name: string;
    completed_trades: number;
    completion_rate: number;
  };
}

export default function P2PTradingPage() {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('BTC');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/trades/p2p/orders?currency=${selectedCurrency}&type=${orderType}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const { data } = await response.json();
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching P2P orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [selectedCurrency, orderType, user]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert>
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please <Link href="/login" className="underline">log in</Link> to access P2P trading.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">P2P Trading</h1>
        <Button asChild>
          <Link href="/trade/p2p/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="buy" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="buy" onClick={() => setOrderType('buy')}>
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" onClick={() => setOrderType('sell')}>
                  Sell
                </TabsTrigger>
              </TabsList>

              <select
                className="p-2 rounded-md border"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
              </select>
            </div>

            <TabsContent value="buy" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Orders Available</AlertTitle>
                  <AlertDescription>
                    There are currently no {orderType} orders for {selectedCurrency}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Orders Available</AlertTitle>
                  <AlertDescription>
                    There are currently no {orderType} orders for {selectedCurrency}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderCard({ order }: { order: P2POrder }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{order.creator.name}</h3>
            <p className="text-sm text-muted-foreground">
              {order.completed_trades} trades • {order.completion_rate}% completion
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">₦{parseFloat(order.price).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Limit: ₦{parseFloat(order.min_order).toLocaleString()} - ₦
              {parseFloat(order.max_order).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {order.payment_methods.map((method) => (
            <span
              key={method}
              className="px-2 py-1 bg-muted rounded-md text-xs"
            >
              {method}
            </span>
          ))}
        </div>
        <Button className="w-full mt-4" asChild>
          <Link href={`/trade/p2p/orders/${order.id}`}>
            {order.type === 'buy' ? 'Sell' : 'Buy'} {order.currency}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
} 