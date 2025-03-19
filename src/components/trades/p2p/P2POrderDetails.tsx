'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Database } from '@/types/database';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { type P2POrder } from '@/lib/types';

interface P2POrderDetailsProps {
  orderId: string;
}

export default function P2POrderDetails({ orderId }: P2POrderDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<P2POrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
        setError(error instanceof Error ? error.message : 'Failed to get user');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) return;

      try {
        const { data, error: supabaseError } = await supabase
          .from('p2p_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (supabaseError) throw supabaseError;
        setOrder(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch order');
        toast({
          title: "Error",
          description: "Failed to fetch order details. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [user, orderId, supabase, toast]);

  const handleSubmit = async (method: 'accept' | 'reject') => {
    if (!user || !order) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('p2p_orders')
        .update({ status: method === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', orderId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      setOrder(data);

      toast({
        title: "Success",
        description: `Order ${method === 'accept' ? 'accepted' : 'rejected'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order');
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p>Order not found or you don't have permission to view it.</p>
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
            onClick={() => handleSubmit('accept')}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept
          </Button>

          <Button
            className="w-full"
            onClick={() => handleSubmit('reject')}
            disabled={isSubmitting || !amount}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 