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
import { TradePreviewModal } from '@/components/InstantSwapModal';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'BNB', label: 'Binance Coin (BNB)' },
  { value: 'SOL', label: 'Solana (SOL)' },
  { value: 'MATIC', label: 'Polygon (MATIC)' },
  { value: 'XRP', label: 'Ripple (XRP)' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)' },
  { value: 'ADA', label: 'Cardano (ADA)' },
  { value: 'DOT', label: 'Polkadot (DOT)' },
  { value: 'LTC', label: 'Litecoin (LTC)' },
  { value: 'LINK', label: 'Chainlink (LINK)' },
  { value: 'BCH', label: 'Bitcoin Cash (BCH)' },
  { value: 'AAVE', label: 'Aave (AAVE)' },
  { value: 'ALGO', label: 'Algorand (ALGO)' },
  { value: 'NEAR', label: 'NEAR Protocol (NEAR)' },
  { value: 'FIL', label: 'Filecoin (FIL)' },
  { value: 'SAND', label: 'The Sandbox (SAND)' },
  { value: 'MANA', label: 'Decentraland (MANA)' },
  { value: 'APE', label: 'ApeCoin (APE)' },
  { value: 'SHIB', label: 'Shiba Inu (SHIB)' },
  { value: 'SUI', label: 'Sui (SUI)' },
  { value: 'INJ', label: 'Injective (INJ)' },
  { value: 'ARB', label: 'Arbitrum (ARB)' },
  { value: 'TON', label: 'Toncoin (TON)' },
  { value: 'RNDR', label: 'Render Token (RNDR)' },
  { value: 'STX', label: 'Stacks (STX)' },
  { value: 'GRT', label: 'The Graph (GRT)' },
  { value: 'TRUMP', label: 'Trump Token (TRUMP)' },
  { value: 'UNI', label: 'Uniswap (UNI)' },
  { value: 'AVAX', label: 'Avalanche (AVAX)' },
  { value: 'ATOM', label: 'Cosmos (ATOM)' },
  { value: 'CAKE', label: 'PancakeSwap (CAKE)' },
  { value: 'COMP', label: 'Compound (COMP)' },
  { value: 'CRV', label: 'Curve DAO (CRV)' },
  { value: 'DAI', label: 'Dai (DAI)' },
  { value: 'ENJ', label: 'Enjin Coin (ENJ)' },
  { value: 'FTM', label: 'Fantom (FTM)' },
  { value: 'GALA', label: 'Gala (GALA)' },
  { value: 'HBAR', label: 'Hedera (HBAR)' },
  { value: 'ICP', label: 'Internet Computer (ICP)' },
  { value: 'KCS', label: 'KuCoin Token (KCS)' },
  { value: 'LDO', label: 'Lido DAO (LDO)' },
  { value: 'MASK', label: 'Mask Network (MASK)' },
  { value: 'MKR', label: 'Maker (MKR)' },
  { value: 'NEO', label: 'NEO (NEO)' },
  { value: 'ONE', label: 'Harmony (ONE)' },
  { value: 'OP', label: 'Optimism (OP)' },
  { value: 'PEPE', label: 'Pepe (PEPE)' },
  { value: 'QNT', label: 'Quant (QNT)' },
  { value: 'RUNE', label: 'THORChain (RUNE)' },
  { value: 'SNX', label: 'Synthetix (SNX)' },
  { value: 'THETA', label: 'Theta Network (THETA)' },
  { value: 'VET', label: 'VeChain (VET)' },
  { value: 'WAVES', label: 'Waves (WAVES)' },
  { value: 'XDC', label: 'XDC Network (XDC)' },
  { value: 'XEC', label: 'eCash (XEC)' },
  { value: 'XEM', label: 'NEM (XEM)' },
  { value: 'XLM', label: 'Stellar (XLM)' },
  { value: 'XTZ', label: 'Tezos (XTZ)' },
  { value: 'ZEC', label: 'Zcash (ZEC)' },
  { value: 'ZIL', label: 'Zilliqa (ZIL)' }
];

// Add min/max amount limits
const AMOUNT_LIMITS = {
  NGN: { min: 1000 },
  USDT: { min: 0.1 },
  BTC: { min: 0.0001 },
  ETH: { min: 0.01 },
  BNB: { min: 0.01 },
  SOL: { min: 0.1 },
  MATIC: { min: 1 },
  XRP: { min: 1 },
  DOGE: { min: 1 },
  ADA: { min: 1 },
  DOT: { min: 0.1 },
  LTC: { min: 0.01 },
  LINK: { min: 0.1 },
  BCH: { min: 0.001 },
  AAVE: { min: 0.01 },
  ALGO: { min: 1 },
  NEAR: { min: 0.1 },
  FIL: { min: 0.1 },
  SAND: { min: 1 },
  MANA: { min: 1 },
  APE: { min: 0.1 },
  SHIB: { min: 1000 },
  SUI: { min: 1 },
  INJ: { min: 0.1 },
  ARB: { min: 0.1 },
  TON: { min: 0.1 },
  RNDR: { min: 0.1 },
  STX: { min: 1 },
  GRT: { min: 1 },
  TRUMP: { min: 1 },
  UNI: { min: 0.1 },
  AVAX: { min: 0.1 },
  ATOM: { min: 0.1 },
  CAKE: { min: 0.1 },
  COMP: { min: 0.01 },
  CRV: { min: 0.1 },
  DAI: { min: 1 },
  ENJ: { min: 1 },
  FTM: { min: 1 },
  GALA: { min: 1 },
  HBAR: { min: 1 },
  ICP: { min: 0.1 },
  KCS: { min: 0.1 },
  LDO: { min: 0.1 },
  MASK: { min: 0.1 },
  MKR: { min: 0.001 },
  NEO: { min: 0.1 },
  ONE: { min: 1 },
  OP: { min: 0.1 },
  PEPE: { min: 1000 },
  QNT: { min: 0.01 },
  RUNE: { min: 0.1 },
  SNX: { min: 0.1 },
  THETA: { min: 1 },
  VET: { min: 1 },
  WAVES: { min: 0.1 },
  XDC: { min: 1 },
  XEC: { min: 1000 },
  XEM: { min: 1 },
  XLM: { min: 1 },
  XTZ: { min: 1 },
  ZEC: { min: 0.01 },
  ZIL: { min: 1 }
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

interface TradeDetails {
  type: string;
  amount: string;
  currency: string;
  rate: number;
  fees: {
    total: number;
    platform: number;
    service: number;
  };
  total: number;
  quote_amount: string;
  ngn_equivalent: number;
  quotation_id: string;
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
  const [confirming, setConfirming] = useState(false); // NEW: track if confirming
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [trade, setTrade] = useState<TradeDetails | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const [toSearchQuery, setToSearchQuery] = useState('');
  const filteredToCurrencies = SUPPORTED_CURRENCIES.filter(currency =>
    currency.label.toLowerCase().includes(toSearchQuery.toLowerCase())
  );

  const [showQuoteButton, setShowQuoteButton] = useState(true);
  const [showProceedButton, setShowProceedButton] = useState(false);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Update balances every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirmation && countdown > 1 && !confirming) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown <= 1) {
      setShowConfirmation(false);
      setQuotation(null);
    }
    return () => clearInterval(timer);
  }, [showConfirmation, countdown, confirming]);

  // Add warning when timer is low
  useEffect(() => {
    if (showConfirmation && countdown > 0 && countdown <= 5) {
      toast({
        title: 'Hurry!',
        description: `Quote expires in ${countdown} seconds`,
        variant: 'destructive', // TODO: Use a 'warning' variant if/when supported by the toast system
      });
    }
  }, [countdown, showConfirmation, toast]);

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
      // Calculate seconds until expiry based on expires_at
      if (data.expires_at) {
        const now = new Date();
        const expires = new Date(data.expires_at);
        const seconds = Math.max(Math.floor((expires.getTime() - now.getTime()) / 1000), 0);
        setCountdown(seconds);
      } else {
        setCountdown(14); // fallback
      }
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

  const handleProceed = async () => {
    if (!amount || !fromCurrency || !toCurrency) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
        className: "bg-red-500/90 text-white border-red-600",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Requesting quote with:', {
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: amount
      });

      // First get the NGN/USDT rate
      const ngnUsdtResponse = await fetch('/api/markets/rate?from=USDT&to=NGN');
      if (!ngnUsdtResponse.ok) {
        throw new Error('Failed to fetch NGN/USDT rate');
      }
      const ngnUsdtData = await ngnUsdtResponse.json();
      const ngnUsdtRate = ngnUsdtData.rate;

      // Get the quote
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: fromCurrency.toLowerCase(),
          to_currency: toCurrency.toLowerCase(),
          from_amount: amount
        })
      });

      console.log('Quote response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response:', error);
        throw new Error(error.error || 'Failed to get quote');
      }

      const quoteData = await response.json();
      console.log('Quote data received:', quoteData);
      
      // Calculate NGN equivalent
      let ngnEquivalent = 0;
      if (fromCurrency === 'USDT') {
        ngnEquivalent = parseFloat(amount) * ngnUsdtRate;
      } else {
        // For other currencies, we need to get their USDT rate first
        const cryptoUsdtResponse = await fetch(`/api/markets/rate?from=${fromCurrency}&to=USDT`);
        if (!cryptoUsdtResponse.ok) {
          throw new Error(`Failed to fetch ${fromCurrency}/USDT rate`);
        }
        const cryptoUsdtData = await cryptoUsdtResponse.json();
        const cryptoUsdtRate = cryptoUsdtData.rate;
        ngnEquivalent = parseFloat(amount) * cryptoUsdtRate * ngnUsdtRate;
      }

      // Calculate fees based on volume tiers
      const VOLUME_TIERS = {
        TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
        TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
        TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
        TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
        TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
      };

      // Convert NGN amount to USD for fee tier calculation (using approximate rate)
      const usdAmount = ngnEquivalent / 1585; // Approximate NGN/USD rate
      
      // Determine fee tier
      let feeTier = VOLUME_TIERS.TIER_1;
      for (const tier of Object.values(VOLUME_TIERS)) {
        if (usdAmount >= tier.min && usdAmount < tier.max) {
          feeTier = tier;
          break;
        }
      }

      // Calculate fees
      const totalFee = (ngnEquivalent * feeTier.fee) / 100;
      
      // Set the trade data with the correct values from the quote
      setTrade({
        type: 'swap',
        amount: amount,
        currency: fromCurrency,
        rate: ngnUsdtRate,
        fees: {
          total: totalFee,
          platform: totalFee,
          service: 0
        },
        total: ngnEquivalent + totalFee,
        quote_amount: quoteData.to_amount,
        ngn_equivalent: ngnEquivalent,
        quotation_id: quoteData.id
      });
      
      // Show the preview modal
      setShowConfirmation(true);
      setCountdown(14);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get quote. Please try again.',
        variant: 'destructive',
        className: "bg-red-500 text-white",
      });
    } finally {
    }
    // If you need to fetch cryptoUsdtRate and ngnUsdtRate, do it here with proper variable declarations, e.g.:
    // const cryptoUsdtResponse = await fetch(...);
    // const cryptoUsdtData = await cryptoUsdtResponse.json();
    // const cryptoUsdtRate = cryptoUsdtData.rate;
    // const ngnUsdtRate = ...;
    // setNgnEquivalent((parseFloat(amount) * cryptoUsdtRate * ngnUsdtRate).toString());
    // For now, comment out the broken code to remove TS errors:
    // const cryptoUsdtData = await cryptoUsdtResponse.json();
    // const cryptoUsdtRate = cryptoUsdtData.rate;
    // ngnEquivalent = parseFloat(amount) * cryptoUsdtRate * ngnUsdtRate;
  }

  // Calculate fees based on volume tiers
  const VOLUME_TIERS = {
    TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
    TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
    TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
    TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
    TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
  };

  // Convert NGN amount to USD for fee tier calculation (using approximate rate)
  const ngnEqNum = typeof ngnEquivalent === 'string' ? parseFloat(ngnEquivalent) : ngnEquivalent;
  const usdAmount = ngnEqNum / 1585; // Approximate NGN/USD rate
  
  // Determine fee tier
  let feeTier = VOLUME_TIERS.TIER_1;
  for (const tier of Object.values(VOLUME_TIERS)) {
    if (typeof usdAmount === 'number' && usdAmount >= tier.min && usdAmount < tier.max) {
      feeTier = tier;
      break;
    }
  }
  // ...rest of your fee logic
  

  
  function resetForm() {
    setAmount('');
    setNgnEquivalent('');
    setUsdEquivalent('');
    setInputCurrency('CRYPTO');
    setFromCurrency('');
    setToCurrency('');
    setToSearchQuery('');
    setShowConfirmation(false);
    setError(null);
  }

  async function handleConfirmTrade() {
    if (!quotation) {
      toast({
        title: 'Error',
        description: 'No active quotation to confirm.',
        variant: 'destructive',
      });
      return;
    }
    setConfirming(true);
    try {
      const response = await fetch(`/api/swap/quotation/${quotation.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotation.id })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm swap');
      }
      // Success
      toast({
        title: 'Swap Confirmed',
        description: 'Your swap has been confirmed successfully!',
        variant: 'default',
      });
      resetForm();
      setShowConfirmation(false);
      setQuotation(null);
      setTrade(null);
      setCountdown(0);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm swap. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  }

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

  // Update the from currency selection to display only wallets with balances
  const fromCurrencyOptions = Object.keys(balances).filter(currency => parseFloat(balances[currency]) > 0);

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From</Label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 max-h-60 overflow-y-auto">
              {fromCurrencyOptions.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 max-h-60 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2">
                <Input
                  type="text"
                  placeholder="Search currencies..."
                  value={toSearchQuery}
                  onChange={(e) => setToSearchQuery(e.target.value)}
                  className="h-9 bg-white dark:bg-gray-800"
                />
              </div>
              {filteredToCurrencies.map(currency => (
                <SelectItem key={currency.value} value={currency.value} className="hover:bg-green-600">
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder={`Enter amount in ${inputCurrency === 'CRYPTO' ? fromCurrency : inputCurrency}`}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value.replace(/,/g, ''))}
          disabled={disabled || !fromCurrency || !toCurrency}
          className="w-full"
        />
        <Button
          variant="outline"
          onClick={handleMaxAmount}
          disabled={disabled || !fromCurrency || !toCurrency}
          className="w-full sm:w-auto"
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
            Minimum: {formatNumber(AMOUNT_LIMITS[fromCurrency as keyof typeof AMOUNT_LIMITS]?.min || 0)} {fromCurrency}
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
      {/* Proceed Button with Loading States */}
      <Button
        className="w-full relative"
        size="lg"
        onClick={handleProceed}
        disabled={loading || !amount || !fromCurrency || !toCurrency}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Getting Quote...
          </span>
        ) : quoting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          "Get Quote"
        )}
      </Button>

      {/* Visual Feedback for Trade Process */}
      {loading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching market rates...</span>
          </div>
        </div>
      )}

      {quoting && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Calculating best rates...</span>
          </div>
        </div>
      )}
    </div>
  );
}
