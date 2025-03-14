'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'USDC', label: 'USD Coin (USDC)' }
];

interface QuoteState {
  id: string;
  rate: number;
  fee: number;
  network_fee: number;
  total: number;
  quote_amount: string;
}

export function GeneralSwapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [availableBalance, setAvailableBalance] = useState('0');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (fromCurrency) {
      fetchBalance();
    }
  }, [isOpen, fromCurrency]);

  const resetForm = () => {
    setFromCurrency('');
    setToCurrency('');
    setAmount('');
    setQuote(null);
    setError(null);
    setAvailableBalance('0');
  };

  const fetchBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();

      const wallet = data.wallets.find(
        (w: any) => w.currency.toLowerCase() === fromCurrency.toLowerCase()
      );
      setAvailableBalance(wallet?.balance || '0');
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const getQuote = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/markets/quote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get quote');
      }

      setQuote(data.quote);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/markets/swap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: quote.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process swap');
      }

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process swap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Instant Swap</DialogTitle>
          <DialogDescription>
            Swap between currencies instantly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>From Currency</Label>
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

          {fromCurrency && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Available: {availableBalance} {fromCurrency}
                  </span>
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>To Currency</Label>
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

              {quote && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Rate</span>
                    <span className="text-sm font-medium">
                      1 {fromCurrency} = {quote.rate} {toCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">You'll Receive</span>
                    <span className="text-sm font-medium">
                      {quote.quote_amount} {toCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Network Fee</span>
                    <span className="text-sm font-medium">
                      {quote.network_fee} {fromCurrency}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <Icons.warning className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={getQuote}
                  disabled={loading || !fromCurrency || !toCurrency || !amount}
                  className="flex-1"
                >
                  Get Quote
                </Button>
                <Button
                  onClick={handleSwap}
                  disabled={loading || !quote}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Swap Now'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 