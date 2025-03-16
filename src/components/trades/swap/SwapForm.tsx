'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ArrowDownUp, Loader2, RefreshCw, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'BNB', label: 'Binance Coin (BNB)' },
  { value: 'SOL', label: 'Solana (SOL)' },
  { value: 'MATIC', label: 'Polygon (MATIC)' },
];

// Add min/max amount limits
const AMOUNT_LIMITS = {
  NGN: { min: 1000, max: 10000000 },
  USDT: { min: 10, max: 100000 },
  BTC: { min: 0.0001, max: 10 },
  ETH: { min: 0.01, max: 100 },
  BNB: { min: 0.01, max: 1000 },
  SOL: { min: 0.1, max: 10000 },
  MATIC: { min: 1, max: 100000 },
};

interface SwapQuotation {
  id: string;
  from_currency: string;
  to_currency: string;
  quoted_price: string;
  from_amount: string;
  to_amount: string;
  expires_at: string;
}

export function SwapForm() {
  const [amount, setAmount] = useState('');
  const [ngnEquivalent, setNgnEquivalent] = useState('');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(14);
  const [quotation, setQuotation] = useState<any>(null);
  
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Update balances every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirmation && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setShowConfirmation(false);
      setQuotation(null);
    }
    return () => clearInterval(timer);
  }, [showConfirmation, countdown]);

  const fetchBalances = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();
      const balanceMap: Record<string, string> = {};
      data.wallets.forEach((wallet: any) => {
        balanceMap[wallet.currency.toUpperCase()] = wallet.balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const getQuote = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    try {
      setQuoting(true);
      const response = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: fromCurrency.toLowerCase(),
          to_currency: toCurrency.toLowerCase(),
          from_amount: amount
        })
      });

      if (!response.ok) throw new Error('Failed to get quote');
      
      const { data } = await response.json();
      setQuotation(data);
      setRate(parseFloat(data.quoted_price));
      setNgnEquivalent(data.to_amount);
      setShowConfirmation(true);
      setCountdown(14);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to get quote. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setQuoting(false);
    }
  };

  const handleSwap = async () => {
    if (!quotation) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/swap/quotation/${quotation.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to confirm swap');

      const data = await response.json();
      toast({
        title: 'Success',
        description: `Successfully swapped ${amount} ${fromCurrency} to ${quotation.to_amount} ${toCurrency}`,
      });

      // Reset form
      setAmount('');
      setNgnEquivalent('');
      setQuotation(null);
      setShowConfirmation(false);
      fetchBalances();
    } catch (error: any) {
      console.error('Swap error:', error);
      toast({
        title: 'Swap Failed',
        description: error.message || 'Failed to complete swap',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    if (toCurrency === 'NGN') return; // Don't swap if NGN is the target
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount('');
    setNgnEquivalent('');
    setRate(null);
  };

  const validateAmount = (value: string): string | null => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }

    const limits = AMOUNT_LIMITS[fromCurrency as keyof typeof AMOUNT_LIMITS];
    if (!limits) return null;

    if (numValue < limits.min) {
      return `Minimum amount is ${formatNumber(limits.min)} ${fromCurrency}`;
    }
    if (numValue > limits.max) {
      return `Maximum amount is ${formatNumber(limits.max)} ${fromCurrency}`;
    }

    const balance = parseFloat(balances[fromCurrency] || '0');
    if (numValue > balance) {
      return `Insufficient ${fromCurrency} balance`;
    }

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    if (!value) {
      setError(null);
      setNgnEquivalent('');
      setRate(null);
      return;
    }

    const error = validateAmount(value);
    if (error) {
      setError(error);
      setNgnEquivalent('');
      setRate(null);
    } else {
      setError(null);
      getQuote();
    }
  };

  const handleProceed = () => {
    if (error || !amount || !rate) return;
    setShowConfirmation(true);
    setCountdown(14);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">You Pay</label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              className={cn("flex-1", error && "border-red-500")}
            />
            <Select value={fromCurrency} onValueChange={(value) => {
              setFromCurrency(value);
              setAmount('');
              setNgnEquivalent('');
              setRate(null);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.filter(c => c.value !== 'NGN' && c.value !== toCurrency).map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Available: {formatNumber(parseFloat(balances[fromCurrency] || '0'), { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {fromCurrency}
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapCurrencies}
          className="mx-auto"
          disabled={toCurrency === 'NGN'}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">You Receive</label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="0.00"
              value={ngnEquivalent}
              readOnly
              className="flex-1"
            />
            <Select value={toCurrency} onValueChange={(value) => {
              setToCurrency(value);
              setAmount('');
              setNgnEquivalent('');
              setRate(null);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.filter(c => c.value !== fromCurrency).map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rate Display */}
        {rate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <div className="flex items-center gap-2">
              <span>1 {fromCurrency} = {formatNumber(rate)} {toCurrency}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={getQuote}
                disabled={quoting}
              >
                <Loader2 className={cn("h-3 w-3", quoting && "animate-spin")} />
              </Button>
            </div>
          </div>
        )}

        {/* Proceed Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleProceed}
          disabled={loading || quoting || !amount || !rate || !!error}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Swap...
            </span>
          ) : (
            'Proceed with Swap'
          )}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Swap</DialogTitle>
            <DialogDescription>
              Please review your swap details. This quote will expire in {countdown} seconds.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <span className="font-medium">{amount} {fromCurrency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="font-medium">{ngnEquivalent} {toCurrency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rate</span>
              <span className="font-medium">1 {fromCurrency} = {rate} {toCurrency}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleSwap} disabled={loading || countdown === 0}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </span>
              ) : (
                'Confirm Swap'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 