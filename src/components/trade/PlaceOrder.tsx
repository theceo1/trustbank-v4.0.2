'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Wallet {
  currency: string;
  balance: string;
  locked: string;
}

interface PlaceOrderProps {
  market: string;
  lastPrice?: string;
  baseAsset: string;
  quoteAsset: string;
}

export default function PlaceOrder({ market, lastPrice, baseAsset, quoteAsset }: PlaceOrderProps) {
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet balances
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/user/wallets');
        if (!response.ok) {
          throw new Error('Failed to fetch wallet balances');
        }
        const { data } = await response.json();
        setWallets(data || []); // Handle the case where data might be null
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet balances');
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  // Find relevant wallet balances
  const baseWallet = wallets.find(w => w.currency.toLowerCase() === baseAsset.toLowerCase());
  const quoteWallet = wallets.find(w => w.currency.toLowerCase() === quoteAsset.toLowerCase());

  const baseBalance = baseWallet ? parseFloat(baseWallet.balance) : 0;
  const quoteBalance = quoteWallet ? parseFloat(quoteWallet.balance) : 0;

  return (
    <Card className="p-4">
      <Tabs value={orderType} onValueChange={setOrderType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant={side === 'buy' ? 'default' : 'outline'}
            onClick={() => setSide('buy')}
            className="w-full"
          >
            Buy
          </Button>
          <Button
            variant={side === 'sell' ? 'default' : 'outline'}
            onClick={() => setSide('sell')}
            className="w-full"
          >
            Sell
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available Balance:</span>
            <span>
              {side === 'buy' 
                ? `${formatNumber(quoteBalance)} ${quoteAsset}`
                : `${formatNumber(baseBalance)} ${baseAsset}`}
            </span>
          </div>

          {orderType === 'limit' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm">Price ({quoteAsset})</label>
                <Input type="number" placeholder="0.00" defaultValue={lastPrice} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm">Amount ({baseAsset})</label>
            <Input type="number" placeholder="0.00" />
          </div>

          {orderType === 'limit' && (
            <div className="space-y-1">
              <label className="text-sm">Total ({quoteAsset})</label>
              <Input type="number" placeholder="0.00" disabled />
            </div>
          )}

          <Button className="w-full" variant={side === 'buy' ? 'default' : 'destructive'}>
            {side === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
} 