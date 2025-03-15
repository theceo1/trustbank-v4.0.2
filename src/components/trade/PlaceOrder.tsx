'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, ArrowRightLeft } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface SwapQuotation {
  id: string;
  from_currency: string;
  to_currency: string;
  quoted_price: string;
  from_amount: string;
  to_amount: string;
  expires_at: string;
}

export default function PlaceOrder({ market, lastPrice, baseAsset, quoteAsset }: PlaceOrderProps) {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(lastPrice || '');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quotation, setQuotation] = useState<SwapQuotation | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState<'crypto' | 'usd' | 'ngn'>('crypto');
  const [timeLeft, setTimeLeft] = useState(14);

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

  // Handle max amount
  const handleMaxAmount = useCallback(() => {
    if (side === 'sell') {
      setAmount(baseWallet?.balance || '0');
    } else if (price) {
      // For buy, calculate max amount based on quote balance
      const maxAmount = quoteWallet ? (parseFloat(quoteWallet.balance) / parseFloat(price)).toString() : '0';
      setAmount(maxAmount);
    }
  }, [side, baseWallet, quoteWallet, price]);

  // Format balance based on selected display option
  const formatBalance = useCallback((balance: number, currency: string) => {
    switch (balanceDisplay) {
      case 'usd':
        return formatCurrency(balance * (currency === 'NGN' ? 0.00067 : 1), 'USD');
      case 'ngn':
        return formatCurrency(balance * (currency === 'USD' ? 1500 : 1), 'NGN');
      default:
        return `${formatNumber(balance)} ${currency}`;
    }
  }, [balanceDisplay]);

  // Timer for quotation expiry
  useEffect(() => {
    if (showConfirmation && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setShowConfirmation(false);
      setQuotation(null);
      setError('Quote expired. Please try again.');
    }
  }, [showConfirmation, timeLeft]);

  // Reset timer when new quote is received
  useEffect(() => {
    if (quotation) {
      setTimeLeft(14);
    }
  }, [quotation]);

  const handleTrade = async () => {
    try {
      setSwapLoading(true);
      setError(null);

      // Get swap quotation
      const quotationResponse = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: side === 'buy' ? quoteAsset : baseAsset,
          to_currency: side === 'buy' ? baseAsset : quoteAsset,
          from_amount: side === 'buy' ? (parseFloat(amount) * parseFloat(price)).toString() : amount
        })
      });

      if (!quotationResponse.ok) {
        throw new Error('Failed to get swap quotation');
      }

      const { data: quotationData } = await quotationResponse.json();
      setQuotation(quotationData);
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create swap quotation');
    } finally {
      setSwapLoading(false);
    }
  };

  const confirmTrade = async () => {
    if (!quotation) return;

    try {
      setSwapLoading(true);
      setError(null);

      const response = await fetch(`/api/swap/quotation/${quotation.id}/confirm`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to confirm swap');
      }

      // Reset form and close modal
      setAmount('');
      setPrice(lastPrice || '');
      setShowConfirmation(false);
      setQuotation(null);

      // Refresh wallet balances
      const walletsResponse = await fetch('/api/user/wallets');
      if (walletsResponse.ok) {
        const { data } = await walletsResponse.json();
        setWallets(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm swap');
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <Tabs value={orderType} onValueChange={setOrderType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
        </TabsList>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">{orderType === 'limit' ? 'Limit Order' : 'Market Order'}</h4>
              <p className="text-sm text-muted-foreground">
                {orderType === 'limit' 
                  ? 'Set your own price for buying or selling. The order will only execute when the market reaches your specified price.'
                  : 'Trade immediately at the current market price. Your order will be executed at the best available price.'}
              </p>
            </div>
          </div>
        </div>

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
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Balance:</span>
            <div className="flex items-center gap-2">
              <Select value={balanceDisplay} onValueChange={(v: 'crypto' | 'usd' | 'ngn') => setBalanceDisplay(v)}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="ngn">NGN</SelectItem>
                </SelectContent>
              </Select>
              <span>
                {loading ? (
                  'Loading...'
                ) : (
                  formatBalance(
                    side === 'buy' ? quoteBalance : baseBalance,
                    side === 'buy' ? quoteAsset : baseAsset
                  )
                )}
              </span>
            </div>
          </div>

          {orderType === 'limit' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm">Price ({quoteAsset})</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm">Amount ({baseAsset})</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={handleMaxAmount}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            </div>
          </div>

          {orderType === 'limit' && price && amount && (
            <div className="space-y-1">
              <label className="text-sm">Total ({quoteAsset})</label>
              <Input 
                type="number" 
                value={(parseFloat(price) * parseFloat(amount)).toString()}
                disabled 
              />
            </div>
          )}

          <Button 
            className="w-full" 
            variant={side === 'buy' ? 'default' : 'destructive'}
            onClick={handleTrade}
            disabled={!amount || (orderType === 'limit' && !price) || loading || swapLoading}
          >
            {swapLoading ? 'Processing...' : side === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </Button>
        </div>
      </Tabs>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {side === 'buy' ? 'Purchase' : 'Sale'}</DialogTitle>
            <DialogDescription>
              Please review the details of your trade. Quote expires in {timeLeft} seconds.
            </DialogDescription>
          </DialogHeader>

          {quotation && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{orderType === 'limit' ? 'Limit Order' : 'Market Order'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">{formatNumber(parseFloat(quotation.quoted_price))} {quoteAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{formatNumber(parseFloat(quotation.from_amount))} {quotation.from_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You will receive:</span>
                <span className="font-medium">{formatNumber(parseFloat(quotation.to_amount))} {quotation.to_currency}</span>
              </div>
              <div className="flex justify-between text-yellow-500">
                <span>Time remaining:</span>
                <span>{timeLeft} seconds</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmTrade}
              disabled={swapLoading || timeLeft === 0}
              variant={side === 'buy' ? 'default' : 'destructive'}
              className={side === 'sell' ? 'text-white hover:text-white' : ''}
            >
              {swapLoading ? 'Processing...' : 'Confirm Trade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 