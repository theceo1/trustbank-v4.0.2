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

  useEffect(() => {
    if (!user && !profileLoading) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        if (!user || profileLoading) {
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          return;
        }

        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/trades/p2p/orders?currency=${selectedCurrency}&type=${orderType}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to fetch orders');
        }
        setOrders(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedCurrency, orderType, user, profileLoading, supabase, router]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please <Link href="/auth/login" className="text-green-600 hover:text-green-700 underline">log in</Link> to access trading features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile?.kyc_verified) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="default" className="border-green-600/20 bg-green-50 dark:bg-green-900/10">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-300">Verification Required</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Please complete your KYC verification to start trading. <Link href="/kyc" className="underline">Click here to verify</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">P2P Trading</h1>
        <Button onClick={() => router.push('/trade/p2p/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="buy" onValueChange={(value) => setOrderType(value as 'buy' | 'sell')}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Sell
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {['BTC', 'ETH', 'USDT', 'USDC'].map((currency) => (
                  <Button
                    key={currency}
                    variant={selectedCurrency === currency ? "default" : "outline"}
                    onClick={() => setSelectedCurrency(currency as SupportedCurrency)}
                  >
                    {currency}
                  </Button>
                ))}
              </div>
            </div>

            <TabsContent value="buy">
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders available
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {order.creator?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.creator?.completed_trades || 0} trades • {order.creator?.completion_rate || 0}% completion
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₦{order.price}</div>
                            <div className="text-sm text-muted-foreground">
                              Limit: ₦{order.min_order} - ₦{order.max_order}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm">Payment Methods:</div>
                          <div className="flex gap-2 mt-1">
                            {order.payment_methods.map((method) => (
                              <div
                                key={method}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                {method}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={() => router.push(`/trade/p2p/orders/${order.id}`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Buy {selectedCurrency}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sell">
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders available
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {order.creator?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.creator?.completed_trades || 0} trades • {order.creator?.completion_rate || 0}% completion
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₦{order.price}</div>
                            <div className="text-sm text-muted-foreground">
                              Limit: ₦{order.min_order} - ₦{order.max_order}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm">Payment Methods:</div>
                          <div className="flex gap-2 mt-1">
                            {order.payment_methods.map((method) => (
                              <div
                                key={method}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                {method}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            onClick={() => router.push(`/trade/p2p/orders/${order.id}`)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sell {selectedCurrency}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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