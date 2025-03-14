'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useProfile } from '@/app/hooks/useProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { type P2POrder } from '@/lib/types';
import { useSupabase } from '@/lib/providers/supabase-provider';

interface P2POrderDetailsProps {
  orderId: string;
}

export function P2POrderDetails({ orderId }: P2POrderDetailsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { supabase } = useSupabase();
  const [order, setOrder] = useState<P2POrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
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

        const response = await fetch(`/api/trades/p2p/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to fetch order');
        }
        setOrder(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, profileLoading, supabase]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!amount) {
        throw new Error('Please enter an amount');
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        throw new Error('Invalid amount');
      }

      if (order) {
        const minOrder = parseFloat(order.min_order);
        const maxOrder = parseFloat(order.max_order);
        if (numAmount < minOrder || numAmount > maxOrder) {
          throw new Error(`Amount must be between ${minOrder} and ${maxOrder}`);
        }
      }

      const response = await fetch(`/api/trades/p2p/orders/${orderId}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        router.push(`/trade/p2p/trades/${data.data.id}`);
      } else {
        throw new Error(data.message || 'Failed to create trade');
      }
    } catch (error) {
      console.error('Failed to create P2P trade:', error);
      setError(error instanceof Error ? error.message : 'Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Order not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{order.type === 'buy' ? 'Buy' : 'Sell'} {order.currency}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price per {order.currency}</Label>
              <div className="text-lg font-bold">₦{order.price}</div>
            </div>
            <div>
              <Label>Available Amount</Label>
              <div className="text-lg font-bold">{order.amount} {order.currency}</div>
            </div>
          </div>

          <div>
            <Label>Payment Methods</Label>
            <div className="flex gap-2 mt-1">
              {order.payment_methods.map((method) => (
                <div
                  key={method}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Terms and Instructions</Label>
            <div className="mt-1 text-sm whitespace-pre-wrap">{order.terms}</div>
          </div>

          <div>
            <Label>Trader Information</Label>
            <div className="mt-1">
              <div className="font-medium">{order.creator?.name || 'Anonymous'}</div>
              <div className="text-sm text-muted-foreground">
                {order.creator?.completed_trades || 0} trades • {order.creator?.completion_rate || 0}% completion
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label>Amount (NGN)</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Limit: ₦{order.min_order} - ₦{order.max_order}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in NGN"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {order.type === 'buy' ? 'Buy' : 'Sell'} {order.currency}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 