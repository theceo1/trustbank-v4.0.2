'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ArrowDownUp, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { quidaxService } from '@/lib/quidax';
import { formatNumber } from '@/lib/utils';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'BNB', label: 'Binance Coin (BNB)' },
  { value: 'SOL', label: 'Solana (SOL)' },
  { value: 'MATIC', label: 'Polygon (MATIC)' },
];

export function SwapForm() {
  const [fromCurrency, setFromCurrency] = useState('USDT');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('0');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      getQuote();
    }
  }, [amount, fromCurrency, toCurrency]);

  const fetchBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quidax_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.quidax_id) return;

      const wallets = await quidaxService.getUserWallets(profile.quidax_id);
      const balanceMap: { [key: string]: string } = {};
      wallets.forEach((wallet) => {
        balanceMap[wallet.currency.toUpperCase()] = wallet.balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const getQuote = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setEstimatedAmount('0');
      setRate(null);
      return;
    }

    try {
      setQuoting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quidax_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.quidax_id) throw new Error('Quidax ID not found');

      const quotation = await quidaxService.getTemporarySwapQuotation(profile.quidax_id, {
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: amount,
      });

      if (quotation) {
        setEstimatedAmount(quotation.to_amount);
        setRate(parseFloat(quotation.quoted_price));
      }
    } catch (error: any) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get quote',
        variant: 'destructive',
      });
    } finally {
      setQuoting(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('quidax_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.quidax_id) throw new Error('Quidax ID not found');

      // Create swap quotation
      const quotation = await quidaxService.createSwapQuotation(profile.quidax_id, {
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: amount,
      });

      // Confirm swap quotation
      await quidaxService.confirmSwapQuotation(profile.quidax_id, quotation.id);

      toast({
        title: 'Swap Successful',
        description: `Successfully swapped ${amount} ${fromCurrency} to ${estimatedAmount} ${toCurrency}`,
      });

      // Reset form
      setAmount('');
      setEstimatedAmount('0');
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
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
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
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Available: {formatNumber(balances[fromCurrency] || '0')} {fromCurrency}
          </div>
        </div>

        {/* Swap Button */}
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background"
                onClick={handleSwapCurrencies}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          <div className="w-full border-t dark:border-gray-800" />
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium">You Receive</label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="0.00"
              value={estimatedAmount}
              disabled
              className="flex-1"
            />
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
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
              {quoting && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSwap}
          disabled={loading || quoting || !amount || !estimatedAmount || estimatedAmount === '0'}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Swap...
            </span>
          ) : (
            `Swap ${fromCurrency} to ${toCurrency}`
          )}
        </Button>

        {/* Disclaimer */}
        <Alert variant="default" className="bg-muted/50">
          <AlertDescription className="text-xs text-muted-foreground">
            The final rate may vary slightly due to market fluctuations. Your swap will be executed at the best available rate at the time of confirmation.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 