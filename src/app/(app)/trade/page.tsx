'use client';

import { useState, useEffect } from 'react';
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

const SUPPORTED_CURRENCIES = [
  { value: 'USDT', label: 'Tether (USDT)', icon: '💵' },
  { value: 'BTC', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', icon: 'Ξ' },
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

export default function TradePage() {
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
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
  
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // Add fee constants
  const SERVICE_FEE_PERCENTAGE = 0.5; // 0.5% service fee
  const NETWORK_FEE = {
    BTC: 0.0001,
    ETH: 0.005,
    USDT: 1
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
          // Wait for 1 second before retrying
          setTimeout(() => fetchBalances(retryCount + 1), 1000);
          return;
        }
        throw new Error('Failed to fetch balances');
      }
      const { data } = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Unexpected response format:', data);
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
      console.error('Error fetching balances:', error);
      if (retryCount < 3) {
        // Wait for 1 second before retrying
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

  const getQuote = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    try {
      setQuoting(true);
      let fromAmount, from_currency, to_currency;
      
      if (tab === 'buy') {
        // For buy, convert input amount to NGN if needed
        if (inputCurrency === 'USD') {
          fromAmount = (parseFloat(amount) * usdRate).toString();
        } else {
          fromAmount = amount;
        }
        from_currency = 'ngn';
        to_currency = selectedCrypto.toLowerCase();
      } else {
        // For sell, we're selling crypto
        fromAmount = amount;
        from_currency = selectedCrypto.toLowerCase();
        to_currency = 'ngn';
      }
      
      const response = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency,
          to_currency,
          from_amount: fromAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote');
      }
      
      const data = await response.json();
      setQuotation(data.data);
      setRate(parseFloat(data.data.quoted_price));
      setNgnEquivalent(data.data.to_amount);
      setShowRate(true);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get quote. Please try again.',
        variant: 'destructive'
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

  const handleAmountChange = (value: string) => {
    // Remove commas before validation and processing
    const numericValue = value.replace(/,/g, '');
    
    const error = validateNumericInput(numericValue, {
      decimals: inputCurrency === 'CRYPTO' ? 8 : 2
    });
    if (error) {
      toast({
        title: 'Invalid Input',
        description: error,
        variant: 'destructive'
      });
      return;
    }
    setAmount(numericValue);
    handleQuoteExpired();
  };

  const getDisplayAmount = () => {
    if (!amount) return '0';
    if (inputCurrency === 'CRYPTO') {
      return formatCryptoAmount(amount);
    }
    return formatCurrency(amount, inputCurrency);
  };

  const getDisplayBalance = () => {
    const balance = balances[inputCurrency] || '0';
    if (inputCurrency === 'CRYPTO') {
      return formatCryptoAmount(balance);
    }
    return formatCurrency(balance, inputCurrency);
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
    const maxBalance = balances[inputCurrency] || '0';
    handleAmountChange(maxBalance);
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive'
      });
      return;
    }
    getQuote();
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

    // Calculate service fee based on user's tier and referral discount
    const serviceFeePercentage = feeConfig.user_tier.fee_percentage;
    const serviceFee = (parsedAmount * serviceFeePercentage) / 100;

    // Get network fee for the currency
    const networkFee = feeConfig.network_fees[currency] || 0;

    const total = serviceFee + networkFee;

    return {
      serviceFee,
      networkFee,
      total,
      feePercentage: serviceFeePercentage
    };
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
            <Tabs value={tab} onValueChange={setTab} className="w-full">
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
                {/* Crypto Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab === 'buy' ? 'Select Asset to Buy' : 'Select Asset to Sell'}
                  </label>
                  <Select
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                    disabled={!hasBasicKyc}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Select cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{currency.icon}</span>
                            {currency.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <span>Available Balance: {getDisplayBalance()}</span>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {tab === 'buy' ? 'Purchase' : 'Sale'}</DialogTitle>
            <DialogDescription>
              Please review the details of your trade. This quote is valid for {countdown} seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <span className="font-medium">
                {tab === 'buy' 
                  ? formatCurrency(amount, inputCurrency)
                  : formatCryptoAmount(amount)} {tab === 'buy' ? inputCurrency : selectedCrypto}
              </span>
            </div>
            
            {/* Add fee display */}
            <div className="space-y-2 border-t border-b py-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Fee ({SERVICE_FEE_PERCENTAGE}%)</span>
                <span className="font-medium">
                  {tab === 'buy'
                    ? formatCurrency(calculateFees(amount, selectedCrypto).serviceFee, inputCurrency)
                    : formatCryptoAmount(calculateFees(amount, selectedCrypto).serviceFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network Fee</span>
                <span className="font-medium">
                  {formatCryptoAmount(calculateFees(amount, selectedCrypto).networkFee)} {selectedCrypto}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="font-medium">
                {tab === 'buy'
                  ? `${formatCryptoAmount(quotation?.to_amount || '0')} ${selectedCrypto}`
                  : formatCurrency(quotation?.to_amount || '0', 'NGN')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rate</span>
              <span className="font-medium">
                1 {selectedCrypto} = {formatCurrency(rate || 0, 'NGN')}
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
              className="sm:flex-1"
              disabled={loading}
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