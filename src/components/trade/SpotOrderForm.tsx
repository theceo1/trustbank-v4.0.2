'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { quidaxService } from '@/lib/quidax';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';

interface SpotOrderFormProps {
  market: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: string;
}

type OrderType = 'limit' | 'market';
type OrderSide = 'buy' | 'sell';

export default function SpotOrderForm({
  market,
  baseAsset,
  quoteAsset,
  lastPrice,
}: SpotOrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [price, setPrice] = useState(lastPrice);
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [sliderValue, setSliderValue] = useState([0]);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const fetchBalances = useCallback(async () => {
    try {
      const response = await fetch('/api/user/wallets');
      const { data: wallets } = await response.json();
      
      const balanceMap: { [key: string]: string } = {};
      wallets.forEach((wallet: { currency: string; balance: string }) => {
        balanceMap[wallet.currency.toUpperCase()] = wallet.balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  useEffect(() => {
    if (lastPrice && orderType === 'limit') {
      setPrice(lastPrice);
    }
  }, [lastPrice, orderType]);

  const calculateTotal = useCallback((newAmount: string, newPrice: string = price) => {
    if (!newAmount || !newPrice) return '';
    const calculatedTotal = parseFloat(newAmount) * parseFloat(newPrice);
    return isNaN(calculatedTotal) ? '' : calculatedTotal.toString();
  }, [price]);

  const updateSliderFromAmount = useCallback((newAmount: string) => {
    const maxBalance = orderSide === 'buy' 
      ? parseFloat(balances[quoteAsset] || '0') / parseFloat(price || '1')
      : parseFloat(balances[baseAsset] || '0');
    
    if (maxBalance > 0) {
      const percentage = (parseFloat(newAmount) / maxBalance) * 100;
      setSliderValue([Math.min(percentage, 100)]);
    }
  }, [orderSide, balances, quoteAsset, baseAsset, price]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    setTotal(calculateTotal(value));
    updateSliderFromAmount(value);
  }, [calculateTotal, updateSliderFromAmount]);

  const handleTotalChange = useCallback((value: string) => {
    setTotal(value);
    if (price && parseFloat(price) > 0) {
      const newAmount = (parseFloat(value) / parseFloat(price)).toString();
      setAmount(newAmount);
      updateSliderFromAmount(newAmount);
    }
  }, [price, updateSliderFromAmount]);

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value);
    const maxBalance = orderSide === 'buy'
      ? parseFloat(balances[quoteAsset] || '0') / parseFloat(price || '1')
      : parseFloat(balances[baseAsset] || '0');
    
    const newAmount = ((value[0] / 100) * maxBalance).toString();
    setAmount(newAmount);
    setTotal(calculateTotal(newAmount));
  }, [orderSide, balances, quoteAsset, baseAsset, price, calculateTotal]);

  const handleSubmit = async () => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast({
        title: 'Invalid Order',
        description: 'Please enter all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quidax_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.quidax_id) throw new Error('Profile not found');

      const response = await fetch('/api/trades/spot/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market,
          side: orderSide,
          ord_type: orderType,
          price: orderType === 'limit' ? price : undefined,
          volume: amount,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to place order');

      toast({
        title: 'Order Placed',
        description: `Successfully placed ${orderSide} order for ${amount} ${baseAsset}`,
      });

      // Reset form
      setAmount('');
      setTotal('');
      setSliderValue([0]);
      
      // Refresh balances
      fetchBalances();
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableBalance = orderSide === 'buy'
    ? balances[quoteAsset]
    : balances[baseAsset];

  return (
    <div className="space-y-6">
      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="limit">Limit Order</TabsTrigger>
          <TabsTrigger value="market">Market Order</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              variant={orderSide === 'buy' ? 'default' : 'outline'}
              onClick={() => setOrderSide('buy')}
              className={orderSide === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Buy
            </Button>
            <Button
              variant={orderSide === 'sell' ? 'default' : 'outline'}
              onClick={() => setOrderSide('sell')}
              className={orderSide === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Sell
            </Button>
          </div>

          <div className="space-y-4">
            {orderType === 'limit' && (
              <div className="space-y-2">
                <Label>Price ({quoteAsset})</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setTotal(calculateTotal(amount, e.target.value));
                  }}
                  placeholder={`Enter price in ${quoteAsset}`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Amount ({baseAsset})</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Enter amount in ${baseAsset}`}
              />
            </div>

            <div className="space-y-2">
              <Label>Total ({quoteAsset})</Label>
              <Input
                type="number"
                value={total}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder={`Enter total in ${quoteAsset}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available:</span>
                <span>{formatNumber(parseFloat(availableBalance || '0'))} {orderSide === 'buy' ? quoteAsset : baseAsset}</span>
              </div>
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {orderType === 'limit'
                  ? `You will ${orderSide} ${amount || '0'} ${baseAsset} at ${price || '0'} ${quoteAsset} per ${baseAsset}`
                  : `You will ${orderSide} ${amount || '0'} ${baseAsset} at market price`}
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              variant={orderSide === 'buy' ? 'default' : 'destructive'}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                'Processing...'
              ) : (
                `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${baseAsset}`
              )}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
} 