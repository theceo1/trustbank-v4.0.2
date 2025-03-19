'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { type SupportedCurrency } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Database } from '@/types/database';

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'ussd', label: 'USSD' },
  { id: 'mobile_money', label: 'Mobile Money' },
];

export default function CreateP2POrderPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('sell');
  const [currency, setCurrency] = useState<SupportedCurrency>('BTC');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxOrder, setMaxOrder] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [terms, setTerms] = useState('');

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user:', error);
        toast({
          title: "Error",
          description: "Failed to get user information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase.auth, toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPaymentMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId);
      }
      return [...prev, methodId];
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!selectedPaymentMethods.length) {
        throw new Error('Please select at least one payment method');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/trades/p2p/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: orderType,
          currency,
          price,
          amount,
          min_order: minOrder,
          max_order: maxOrder,
          payment_methods: selectedPaymentMethods,
          terms
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        router.push('/trade/p2p');
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Failed to create P2P order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create order',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create P2P Order</h1>
      
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>Create P2P Order</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sell" onValueChange={(value) => setOrderType(value as 'buy' | 'sell')}>
              <TabsList className="grid grid-cols-2 w-[200px]">
                <TabsTrigger value="sell">Sell</TabsTrigger>
                <TabsTrigger value="buy">Buy</TabsTrigger>
              </TabsList>

              <div className="space-y-6 mt-6">
                <div>
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value as SupportedCurrency)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Price per {currency} (NGN)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price in NGN"
                  />
                </div>

                <div>
                  <Label>Amount ({currency})</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${currency}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Order (NGN)</Label>
                    <Input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      placeholder="Min order amount"
                    />
                  </div>
                  <div>
                    <Label>Maximum Order (NGN)</Label>
                    <Input
                      type="number"
                      value={maxOrder}
                      onChange={(e) => setMaxOrder(e.target.value)}
                      placeholder="Max order amount"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Payment Methods</Label>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={method.id}
                          checked={selectedPaymentMethods.includes(method.id)}
                          onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                        />
                        <label
                          htmlFor={method.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Terms and Instructions</Label>
                  <Textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Enter your trading terms and payment instructions"
                    className="h-32"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading || !price || !amount || !minOrder || !maxOrder || selectedPaymentMethods.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create {orderType === 'buy' ? 'Buy' : 'Sell'} Order
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
} 