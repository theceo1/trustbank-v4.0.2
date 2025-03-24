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
import { KYCBanner } from '@/components/trades/KYCBanner';
import { Label } from '@/components/ui/label';

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

interface SwapFormProps {
  disabled?: boolean;
}

export function SwapForm({ disabled }: SwapFormProps) {
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState<'CRYPTO' | 'NGN' | 'USD'>('CRYPTO');
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [ngnEquivalent, setNgnEquivalent] = useState('');
  const [usdEquivalent, setUsdEquivalent] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quotation, setQuotation] = useState<SwapQuotation | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
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
      const response = await fetch('/api/swap/quote', {
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
      const response = await fetch(`/api/swap/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: quotation.id
        })
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

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setNgnEquivalent('');
      setUsdEquivalent('');
      return;
    }

    // Convert based on input currency
    if (inputCurrency === 'NGN') {
      // Convert NGN to crypto
      if (rate) {
        const cryptoAmount = numValue / rate;
        setAmount(cryptoAmount.toString());
        setNgnEquivalent(value);
        setUsdEquivalent((numValue / 1585).toFixed(2)); // Using approximate NGN/USD rate
      }
    } else if (inputCurrency === 'USD') {
      // Convert USD to crypto
      if (rate) {
        const ngnAmount = numValue * 1585; // Using approximate NGN/USD rate
        const cryptoAmount = ngnAmount / rate;
        setAmount(cryptoAmount.toString());
        setNgnEquivalent(ngnAmount.toString());
        setUsdEquivalent(value);
      }
    } else {
      // Input is in crypto
      if (rate) {
        setNgnEquivalent((numValue * rate).toString());
        setUsdEquivalent(((numValue * rate) / 1585).toFixed(2)); // Using approximate NGN/USD rate
      }
    }
  };

  const handleProceed = () => {
    if (error || !amount || !rate) return;
    setShowConfirmation(true);
    setCountdown(14);
  };

  const handleMaxAmount = () => {
    if (!fromCurrency || !balances[fromCurrency]) return;
    
    const maxBalance = parseFloat(balances[fromCurrency]);
    if (isNaN(maxBalance)) return;

    if (inputCurrency === 'CRYPTO') {
      handleAmountChange(maxBalance.toString());
    } else if (inputCurrency === 'NGN' && rate) {
      handleAmountChange((maxBalance * rate).toString());
    } else if (inputCurrency === 'USD' && rate) {
      handleAmountChange(((maxBalance * rate) / 1585).toString()); // Using approximate NGN/USD rate
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From</Label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem 
                  key={currency.value} 
                  value={currency.value}
                  disabled={currency.value === toCurrency}
                >
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem 
                  key={currency.value} 
                  value={currency.value}
                  disabled={currency.value === fromCurrency}
                >
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount Input with Currency Toggle */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Amount</Label>
          <div className="flex items-center gap-2">
            <Button
              variant={inputCurrency === 'CRYPTO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputCurrency('CRYPTO')}
              className="text-xs"
            >
              {fromCurrency}
            </Button>
            <Button
              variant={inputCurrency === 'NGN' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputCurrency('NGN')}
              className="text-xs"
            >
              NGN
            </Button>
            <Button
              variant={inputCurrency === 'USD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputCurrency('USD')}
              className="text-xs"
            >
              USD
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={`Enter amount in ${inputCurrency === 'CRYPTO' ? fromCurrency : inputCurrency}`}
            value={inputCurrency === 'CRYPTO' ? 
              amount ? formatNumber(parseFloat(amount)) : '' : 
              inputCurrency === 'NGN' ? 
                ngnEquivalent ? formatNumber(parseFloat(ngnEquivalent)) : '' :
                usdEquivalent ? formatNumber(parseFloat(usdEquivalent)) : ''
            }
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, '');
              handleAmountChange(value);
            }}
            disabled={disabled || !fromCurrency || !toCurrency}
          />
          <Button
            variant="outline"
            onClick={handleMaxAmount}
            disabled={disabled || !fromCurrency || !toCurrency}
          >
            Max
          </Button>
        </div>

        {/* Show balance and limits */}
        {fromCurrency && (
          <div className="text-sm space-y-1">
            <div className="text-green-600 font-medium">
              Balance: {formatNumber(parseFloat(balances[fromCurrency] || '0'))} {fromCurrency}
            </div>
            <div className="text-muted-foreground">
              Limit: {formatNumber(AMOUNT_LIMITS[fromCurrency as keyof typeof AMOUNT_LIMITS]?.min || 0)} - {formatNumber(AMOUNT_LIMITS[fromCurrency as keyof typeof AMOUNT_LIMITS]?.max || 0)} {fromCurrency}
            </div>
          </div>
        )}

        {/* Show equivalents */}
        {amount && rate && (
          <div className="text-sm text-muted-foreground space-y-1">
            {inputCurrency !== 'CRYPTO' && (
              <div>≈ {formatNumber(parseFloat(amount))} {fromCurrency}</div>
            )}
            {inputCurrency !== 'NGN' && (
              <div>≈ ₦{formatNumber(parseFloat(ngnEquivalent))}</div>
            )}
            {inputCurrency !== 'USD' && (
              <div>≈ ${formatNumber(parseFloat(usdEquivalent))}</div>
            )}
          </div>
        )}
      </div>

      {/* Proceed Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleProceed}
        disabled={loading || quoting || !amount || !rate || !!error || disabled}
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