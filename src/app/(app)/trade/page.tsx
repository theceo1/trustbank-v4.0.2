'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, Wallet, Clock, TrendingUp, Users, Loader2, Info, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  formatCurrency,
  formatCryptoAmount,
  formatRate,
  parseNumericInput,
  validateNumericInput,
  type NumericValue
} from '@/lib/format';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useKycStatus } from '@/hooks/useKycStatus';
import { Database } from '@/lib/database.types';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira' },
  { value: 'USDT', label: 'Tether' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'BNB', label: 'Binance Coin' },
  { value: 'SOL', label: 'Solana' },
  { value: 'MATIC', label: 'Polygon' },
  { value: 'XRP', label: 'Ripple' },
  { value: 'DOGE', label: 'Dogecoin' },
  { value: 'ADA', label: 'Cardano' },
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

const INPUT_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
];

const TRADING_OPTIONS = [
  {
    id: 'advanced',
    title: 'Advanced Trading',
    description: 'Professional trading interface with charts, order books, and advanced order types.',
    icon: TrendingUp,
    tags: ['Limit', 'Market', 'Stop'],
    href: '/trade/spot',
  },
  {
    id: 'p2p',
    title: 'P2P Exchange',
    description: 'Buy/sell directly with other users. Set your own prices and payment methods.',
    icon: Users,
    tags: ['Bank Transfer', 'USSD'],
    href: '/trade/p2p',
  },
  {
    id: 'swap',
    title: 'Crypto Swap',
    description: 'Instantly convert between cryptocurrencies at guaranteed rates. No order book needed.',
    icon: ArrowUpDown,
    tags: ['BTC/ETH', 'ETH/USDT'],
    href: '/trade/swap',
  },
];

interface FeeConfig {
  base_fees: {
    quidax: number;
    trustBank: number;
    total: number;
  };
  network_fees: {
    [key: string]: number;
  };
  user_tier: {
    trading_volume: number;
    fee_percentage: number;
    tier_level: string;
    next_tier: {
      min: number;
      max: number;
      fee: number;
    } | null;
  };
  referral_discount: number;
  volume_tiers: {
    [key: string]: {
      min: number;
      max: number;
      fee: number;
    };
  };
}

interface Currency {
  value: string;
  label: string;
}

const AMOUNT_LIMITS: Record<string, { min: number }> = {
  NGN: { min: 1000 },
  USDT: { min: 0.1 },
  BTC: { min: 0.0001 },
  ETH: { min: 0.001 },
  BNB: { min: 0.01 },
  SOL: { min: 0.1 },
  MATIC: { min: 1 },
  XRP: { min: 10 },
  DOGE: { min: 100 },
  ADA: { min: 10 }
};

export default function TradePage() {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [inputCurrency, setInputCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(14);
  const [quotation, setQuotation] = useState<any>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [rate, setRate] = useState<number | null>(null);
  const [ngnEquivalent, setNgnEquivalent] = useState('');
  const [usdRate, setUsdRate] = useState<number>(0);
  const [showRate, setShowRate] = useState(false);
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const { hasBasicKyc, loading: kycLoading } = useKycStatus();
  const [trade, setTrade] = useState<any>(null);
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;
  
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // Add fee constants
  const SERVICE_FEE_PERCENTAGE = 0.5; // 0.5% service fee
  const NETWORK_FEE: Record<string, number> = {
    BTC: 0.0001,
    ETH: 0.005,
    USDT: 1,
    BNB: 0.001,
    SOL: 0.01,
    MATIC: 0.1,
    XRP: 0.2,
    DOGE: 1,
    ADA: 1
  };

  useEffect(() => {
    fetchBalances();
    fetchUsdRate();
    const interval = setInterval(() => {
      fetchBalances();
      fetchUsdRate();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirmation && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      handleQuoteExpired();
    }
    return () => clearInterval(timer);
  }, [showConfirmation, countdown]);

  // Update input currency when crypto is selected
  useEffect(() => {
    if (inputCurrency === 'CRYPTO') {
      setAmount(''); // Reset amount when switching to crypto
      setShowRate(false);
      setQuotation(null);
    }
  }, [inputCurrency, selectedCrypto]);

  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const response = await fetch('/api/config/fees');
        if (!response.ok) throw new Error('Failed to fetch fee configuration');
        const data = await response.json();
        if (data.status === 'success') {
          setFeeConfig(data.data);
        }
      } catch (error) {
        console.error('Error fetching fee config:', error);
      }
    };

    fetchFeeConfig();
  }, []);

  const fetchUsdRate = async () => {
    try {
      const response = await fetch('/api/markets/usdtngn/ticker');
      if (!response.ok) throw new Error('Failed to fetch USD rate');
      const data = await response.json();
      setUsdRate(parseFloat(data.data.price));
    } catch (error) {
      console.error('Error fetching USD rate:', error);
    }
  };

  const fetchBalances = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/user/wallets');
      if (!response.ok) {
        if (retryCount < 3) {
          setTimeout(() => fetchBalances(retryCount + 1), 1000);
          return;
        }
        throw new Error('Failed to fetch balances');
      }
      const { data } = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }

      const balanceMap: Record<string, string> = {};
      data.forEach((wallet: any) => {
        if (wallet && typeof wallet.currency === 'string' && typeof wallet.balance === 'string') {
          balanceMap[wallet.currency] = wallet.balance;
        }
      });
      setBalances(balanceMap);
    } catch (error) {
      if (retryCount < 3) {
        setTimeout(() => fetchBalances(retryCount + 1), 1000);
      }
    }
  };

  const convertToNGN = (value: string): number => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;

    switch (inputCurrency) {
      case 'USD':
        return numValue * usdRate;
      case 'CRYPTO':
        return numValue * (rate || 0);
      default:
        return numValue;
    }
  };

  // Filter currencies based on search query
  const filteredCurrencies = SUPPORTED_CURRENCIES.filter((currency) =>
    currency.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get paginated currencies
  const paginatedCurrencies = filteredCurrencies.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  // Get available currencies with balance for sell tab
  const availableCurrencies = SUPPORTED_CURRENCIES.filter((currency) => {
    const balance = parseFloat(balances[currency.value.toLowerCase()] || '0');
    return balance > 0;
  });

  const getQuote = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    try {
      setQuoting(true);
      
      // Log the request payload for debugging
      const payload = {
        from_currency: tab === 'buy' ? 'ngn' : selectedCrypto.toLowerCase(),
        to_currency: tab === 'buy' ? selectedCrypto.toLowerCase() : 'ngn',
        from_amount: amount
      };
      console.log('Quote request payload:', payload);

      const response = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote error response:', errorData);
        throw new Error(errorData.error || 'Failed to get quote');
      }
      
      const data = await response.json();
      console.log('Quote response:', data);

      if (data.status !== 'success' || !data.data) {
        throw new Error('Invalid quote response');
      }

      if (data.status === 'success' && data.data) {
        setQuotation(data.data);
        setRate(parseFloat(data.data.quoted_price));
        setNgnEquivalent(data.data.to_amount);
        setShowRate(true);
      } else {
        throw new Error('Invalid quote response format');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get quote. Please try again.',
        variant: 'destructive',
        className: "bg-red-500 text-white border-none",
      });
    } finally {
      setQuoting(false);
    }
  };

  const handleQuoteExpired = () => {
    setShowConfirmation(false);
    setQuotation(null);
    setShowRate(false);
    setCountdown(14);
  };

  const handleCancelQuote = () => {
    handleQuoteExpired();
  };

  const handleAmountChange = async (value: string) => {
    const numericValue = value.replace(/,/g, '');
    
    // Basic numeric validation
    const error = validateNumericInput(numericValue, {
      decimals: inputCurrency === 'CRYPTO' ? 8 : 2
    });
    if (error) {
      toast({
        title: 'Invalid Input',
        description: error,
        variant: 'destructive',
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    try {
      let convertedAmount = parseFloat(numericValue);
      let ngnAmount = 0;

      // Get current rates
      const rateResponse = await fetch(`/api/markets/rate?from=USDT&to=NGN`);
      if (!rateResponse.ok) throw new Error('Failed to fetch rate');
      const rateData = await rateResponse.json();
      const ngnUsdtRate = rateData.rate;

      if (inputCurrency === 'CRYPTO') {
        if (tab === 'sell') {
          // For sell orders, get NGN equivalent
          const cryptoUsdtResponse = await fetch(`/api/markets/rate?from=${selectedCrypto}&to=USDT`);
          if (!cryptoUsdtResponse.ok) throw new Error('Failed to fetch rate');
          const cryptoUsdtData = await cryptoUsdtResponse.json();
          ngnAmount = convertedAmount * cryptoUsdtData.rate * ngnUsdtRate;
        }
      } else if (inputCurrency === 'USD') {
        ngnAmount = convertedAmount * ngnUsdtRate;
        convertedAmount = ngnAmount;
      } else {
        // Input is already in NGN
        ngnAmount = convertedAmount;
      }

      // Validate minimum NGN amount for both buy and sell
      if (ngnAmount < 1000) {
        toast({
          title: 'Invalid Amount',
          description: `Minimum amount is ₦1,000 (current: ₦${formatNumber(ngnAmount)})`,
          variant: 'destructive',
          className: "bg-red-500 text-white border-none",
        });
        return;
      }

      // For sell orders, also validate crypto minimum
      if (tab === 'sell' && inputCurrency === 'CRYPTO') {
        const cryptoMin = AMOUNT_LIMITS[selectedCrypto]?.min || 0;
        if (cryptoMin > 0 && convertedAmount < cryptoMin) {
          toast({
            title: 'Invalid Amount',
            description: `Minimum amount is ${cryptoMin} ${selectedCrypto}`,
            variant: 'destructive',
            className: "bg-red-500 text-white border-none",
          });
          return;
        }

        // Check balance
        const balance = parseFloat(balances[selectedCrypto.toLowerCase()] || '0');
        if (convertedAmount > balance) {
          toast({
            title: 'Insufficient Balance',
            description: `You have ${formatNumber(balance)} ${selectedCrypto} available`,
            variant: 'destructive',
            className: "bg-red-500 text-white border-none",
          });
          return;
        }
      }

      setAmount(convertedAmount.toString());
      setNgnEquivalent(ngnAmount.toString());
      handleQuoteExpired();
    } catch (error) {
      console.error('Error converting amount:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate amount. Please try again.',
        variant: 'destructive',
        className: "bg-red-500 text-white border-none",
      });
    }
  };

  const getDisplayAmount = () => {
    if (!amount) return '0';
    if (inputCurrency === 'CRYPTO') {
      return formatCryptoAmount(amount);
    }
    return formatCurrency(amount, inputCurrency);
  };

  const getDisplayBalance = () => {
    if (!selectedCrypto) return '0.00';
    const balance = balances[selectedCrypto.toLowerCase()] || '0';
    return formatNumber(parseFloat(balance), { maximumFractionDigits: 8 }); // Show up to 8 decimal places for crypto
  };

  const getDisplayRate = () => {
    if (!rate) return '0';
    if (isNaN(rate)) return '0';
    
    return formatRate(rate.toString(), {
      inputCurrency: 'USDT',
      outputCurrency: 'NGN'
    });
  };

  const formatInputAmount = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Parse the numeric value
    const parsedValue = parseFloat(numericValue);
    if (isNaN(parsedValue)) return '';
    
    // Format with commas for thousands
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: inputCurrency === 'CRYPTO' ? 8 : 2,
      useGrouping: true
    }).format(parsedValue);
  };

  const handleMaxAmount = () => {
    if (!selectedCrypto) return;
    
    const balance = balances[selectedCrypto.toLowerCase()];
    if (!balance) return;
    
    const maxBalance = parseFloat(balance);
    if (isNaN(maxBalance)) return;
    
    setAmount(maxBalance.toString());
    handleQuoteExpired();
  };

  const handleProceed = async () => {
    if (!amount || !selectedCrypto) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate amount
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Calculate NGN equivalent for validation
      let ngnAmount;
      if (tab === 'buy') {
        ngnAmount = numericAmount;
      } else {
        // For sell orders, get current rate to calculate NGN equivalent
        const rateResponse = await fetch(`/api/markets/rate?from=${selectedCrypto}&to=NGN`);
        if (!rateResponse.ok) throw new Error('Failed to fetch rate');
        const rateData = await rateResponse.json();
        ngnAmount = numericAmount * rateData.rate;
      }

      // Check NGN minimum
      if (ngnAmount < 1000) {
        throw new Error(`Amount must be at least ₦1,000 (current: ₦${formatNumber(ngnAmount)})`);
      }

      // Check crypto minimum for sell orders
      if (tab === 'sell') {
        const cryptoMin = AMOUNT_LIMITS[selectedCrypto] || { min: 0 };
        if (cryptoMin.min > 0 && numericAmount < cryptoMin.min) {
          throw new Error(`Minimum amount is ${cryptoMin.min} ${selectedCrypto}`);
        }

        // Check balance
        const balance = parseFloat(balances[selectedCrypto.toLowerCase()] || '0');
        if (numericAmount > balance) {
          throw new Error(`Insufficient ${selectedCrypto} balance (${formatNumber(balance)} ${selectedCrypto} available)`);
        }
      }

      // Get quote
      const payload = {
        from_currency: tab === 'buy' ? 'ngn' : selectedCrypto.toLowerCase(),
        to_currency: tab === 'buy' ? selectedCrypto.toLowerCase() : 'ngn',
        from_amount: amount
      };
      console.log('Quote request payload:', payload);

      const response = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote error response:', errorData);
        throw new Error(errorData.message || 'Failed to get quote');
      }

      const data = await response.json();
      console.log('Quote response:', data);

      if (data.status !== 'success' || !data.data) {
        throw new Error('Invalid quote response');
      }

      // Calculate fees
      const platformFee = feeConfig ? (ngnAmount * feeConfig.user_tier.fee_percentage) / 100 : 0;

      // Calculate network fee
      const networkFee = calculateNetworkFee(selectedCrypto);
      const totalFee = platformFee + networkFee;

      // Set trade details
      setTrade({
        type: 'swap',
        amount: amount,
        currency: tab === 'buy' ? 'NGN' : selectedCrypto,
        rate: parseFloat(data.data.quoted_price),
        fees: {
          total: totalFee,
          platform: platformFee,
          network: networkFee
        },
        total: ngnAmount + totalFee,
        quote_amount: data.data.to_amount,
        ngn_equivalent: ngnAmount,
        quotation_id: data.data.id
      });

      // Show confirmation dialog
      setShowConfirmation(true);
      setCountdown(14);

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process trade',
        variant: 'destructive',
        className: "bg-red-500 text-white border-none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!quotation) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/swap/quotation/${quotation.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to confirm trade');

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'Trade completed successfully!',
      });

      // Reset form
      setAmount('');
      setQuotation(null);
      setShowConfirmation(false);
      setShowRate(false);
      fetchBalances();
    } catch (error) {
      console.error('Error confirming trade:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm trade. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = (amount: string, currency: string) => {
    if (!feeConfig) return { serviceFee: 0, networkFee: 0, total: 0 };

    const parsedAmount = parseFloat(amount || '0');
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { serviceFee: 0, networkFee: 0, total: 0 };
    }

    // Calculate service fee based on user's tier
    const serviceFeePercentage = feeConfig.user_tier.fee_percentage;
    const serviceFee = (parsedAmount * serviceFeePercentage) / 100;

    // Network fee only applies when selling crypto to NGN
    const networkFee = tab === 'sell' ? (NETWORK_FEE[currency] || 0) : 0;

    const total = serviceFee + networkFee;

    return {
      serviceFee,
      networkFee,
      total,
      feePercentage: serviceFeePercentage
    };
  };

  // Update currencies when tab or selectedCrypto changes
  useEffect(() => {
    setFromCurrency(tab === 'buy' ? 'ngn' : selectedCrypto.toLowerCase());
    setToCurrency(tab === 'buy' ? selectedCrypto.toLowerCase() : 'ngn');
  }, [tab, selectedCrypto]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page on search
  };

  // Add helper function to calculate fee tier
  const calculateFeeTier = (usdAmount: number) => {
    const VOLUME_TIERS = {
      TIER_1: { min: 0, max: 1000, fee: 4.0 },
      TIER_2: { min: 1000, max: 5000, fee: 3.5 },
      TIER_3: { min: 5000, max: 20000, fee: 3.0 },
      TIER_4: { min: 20000, max: 100000, fee: 2.8 },
      TIER_5: { min: 100000, max: Infinity, fee: 2.5 }
    };

    for (const tier of Object.values(VOLUME_TIERS)) {
      if (usdAmount >= tier.min && usdAmount < tier.max) {
        return tier;
      }
    }
    return VOLUME_TIERS.TIER_1;
  };

  // In handleProceed function
  const calculateNetworkFee = (currency: string): number => {
    return tab === 'sell' ? (NETWORK_FEE[currency.toUpperCase()] || 0) : 0;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 space-y-8">
      {/* Header Section */}
      <div className="py-8 border-b">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to trustBank Trading</h1>
        <p className="text-muted-foreground">
          Experience seamless trading with our advanced platform. Choose from multiple trading options and enjoy competitive rates with top-notch security.
        </p>
      </div>

      {/* KYC Banner */}
      {!hasBasicKyc && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Complete KYC to Start Trading
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              To ensure the security of our platform and comply with regulations, you need to complete basic KYC verification before trading.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/kyc" className="inline-flex items-center">
                Complete Verification
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Trade Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="buy"
              className="w-full"
              onValueChange={(value) => setTab(value as 'buy' | 'sell')}
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger 
                  value="buy" 
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  disabled={!hasBasicKyc}
                >
                  Buy Crypto
                </TabsTrigger>
                <TabsTrigger 
                  value="sell"
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  disabled={!hasBasicKyc}
                >
                  Sell Crypto
                </TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                {/* Currency Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab === 'buy' ? 'Select Asset to Buy' : 'Select Asset to Sell'}
                  </label>
                  <Select
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                    disabled={!hasBasicKyc}
                  >
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select cryptocurrency">
                        {selectedCrypto && (
                          <span className="flex items-center gap-2">
                            {SUPPORTED_CURRENCIES.find(c => c.value === selectedCrypto)?.label}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-white dark:bg-gray-800"
                      align="start"
                      position="popper"
                      sideOffset={8}
                    >
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b">
                        <Input
                          type="text"
                          placeholder="Search currencies..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="h-9"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto py-1">
                        {tab === 'sell' ? (
                          availableCurrencies.length > 0 ? (
                            availableCurrencies.map((currency) => (
                              <SelectItem 
                                key={currency.value} 
                                value={currency.value}
                                className="cursor-pointer hover:bg-green-600 hover:text-white transition-colors py-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{currency.label}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No currencies with balance available
                            </div>
                          )
                        ) : (
                          paginatedCurrencies.map((currency) => (
                            <SelectItem 
                              key={currency.value} 
                              value={currency.value}
                              className="cursor-pointer hover:bg-green-600 hover:text-white transition-colors py-2"
                            >
                              <div className="flex items-center justify-between">
                                <span>{currency.label}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </div>
                      {tab === 'buy' && filteredCurrencies.length > itemsPerPage && (
                        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 p-2 border-t">
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => Math.max(0, p - 1))}
                              disabled={page === 0}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {page + 1} of {Math.ceil(filteredCurrencies.length / itemsPerPage)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => p + 1)}
                              disabled={(page + 1) * itemsPerPage >= filteredCurrencies.length}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {tab === 'sell' && availableCurrencies.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You don't have any currencies available to sell. Please deposit or buy some crypto first.
                    </p>
                  )}
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab === 'buy' ? 'Enter Amount to Buy' : 'Enter Amount to Sell'}
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full pr-24"
                      placeholder="0.00"
                      disabled={!hasBasicKyc}
                    />
                    <Select
                      value={inputCurrency}
                      onValueChange={setInputCurrency}
                      disabled={!hasBasicKyc}
                    >
                      <SelectTrigger className="absolute right-1 top-1 bottom-1 w-20 bg-white dark:bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        {INPUT_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <span>Available Balance: {getDisplayBalance()}</span>
                      {selectedCrypto && (
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          <span>
                            Min. Amount: {tab === 'buy' ? '₦1,000' : `${AMOUNT_LIMITS[selectedCrypto]?.min || 0} ${selectedCrypto}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaxAmount}
                      disabled={!hasBasicKyc}
                      className="text-primary hover:text-primary/80"
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                  onClick={showRate ? () => setShowConfirmation(true) : handleProceed}
                  disabled={loading || quoting || !amount || !hasBasicKyc}
                >
                  {quoting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting Quote...
                    </span>
                  ) : showRate ? (
                    `Proceed with ${tab === 'buy' ? 'Purchase' : 'Sale'}`
                  ) : (
                    'Get Quote'
                  )}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Market Info Card */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Market Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Rate</p>
                <p className="text-lg font-semibold">{getDisplayRate()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">24h Change</p>
                <p className="text-lg font-semibold text-green-600">
                  {quotation?.price_change_24h || '0.00'}%
                </p>
              </div>
            </div>

            {feeConfig && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Your Trading Fees</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Tier</span>
                      <span>{feeConfig.user_tier.tier_level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee Rate</span>
                      <span>{feeConfig.user_tier.fee_percentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span>{NETWORK_FEE[selectedCrypto as keyof typeof NETWORK_FEE]} {selectedCrypto}</span>
                    </div>
                  </div>
                </div>

                {feeConfig.user_tier.next_tier && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
                    <AlertDescription className="text-sm text-green-600">
                      Trade {formatCurrency(feeConfig.user_tier.next_tier.min - feeConfig.user_tier.trading_volume, 'USD')} more to reach next tier ({feeConfig.user_tier.next_tier.fee}% fee)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Confirm {tab === 'buy' ? 'Purchase' : 'Sale'}</DialogTitle>
            <DialogDescription>
              Please review the details of your trade. This quote is valid for {countdown} seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Details */}
            <div className="space-y-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You Pay</span>
                <span className="font-medium">
                  {tab === 'buy' 
                    ? `₦${formatNumber(parseFloat(amount))}`
                    : `${formatNumber(parseFloat(amount))} ${selectedCrypto}`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You Receive</span>
                <span className="font-medium">
                  {quotation ? (
                    tab === 'buy'
                      ? `${formatNumber(parseFloat(quotation.to_amount), { maximumFractionDigits: 8 })} ${selectedCrypto}`
                      : `₦${formatNumber(parseFloat(quotation.to_amount))}`
                  ) : (
                    'Calculating...'
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="font-medium">
                  {rate ? (
                    tab === 'buy'
                      ? `1 ${selectedCrypto} = ₦${formatNumber(rate)}`
                      : `1 ${selectedCrypto} = ₦${formatNumber(rate)}`
                  ) : (
                    'Calculating...'
                  )}
                </span>
              </div>
            </div>

            {/* Fees */}
            <div className="space-y-2 border-t border-b py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Service Fee ({feeConfig?.user_tier.fee_percentage || 0}%)
                </span>
                <span className="font-medium">
                  ₦{formatNumber(calculateFees(amount, selectedCrypto).serviceFee)}
                </span>
              </div>
              {tab === 'sell' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Network Fee</span>
                  <span className="font-medium">
                    {formatNumber(calculateFees(amount, selectedCrypto).networkFee)} {selectedCrypto}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center font-semibold">
              <span>Total Amount</span>
              <span>
                {tab === 'buy'
                  ? `₦${formatNumber(parseFloat(amount) + calculateFees(amount, selectedCrypto).serviceFee)}`
                  : `${formatNumber(parseFloat(amount) + calculateFees(amount, selectedCrypto).networkFee)} ${selectedCrypto}`}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCancelQuote}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              className="sm:flex-1 bg-green-500 hover:bg-green-600"
              disabled={loading || !quotation}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm Trade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 