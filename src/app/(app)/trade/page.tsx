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
import { ArrowUpDown, Wallet, Clock, TrendingUp, Users, Loader2, Info } from 'lucide-react';
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
  
  const { toast } = useToast();

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
      const balanceMap: Record<string, string> = {};
      data.forEach((wallet: any) => {
        balanceMap[wallet.currency] = wallet.balance;
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 border-b">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to trustBank Trading
            </h1>
            <p className="mt-6 max-w-3xl text-xl text-muted-foreground">
              Experience seamless trading with our advanced platform. Choose from multiple trading options and
              enjoy competitive rates with top-notch security.
            </p>
            <div className="mt-8 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-500" />
                <span>Bank-grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                <span>24/7 Trading</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Real-time Rates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Trade Form */}
          <Card className="lg:col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Quick Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="buy" className="text-lg">Buy Crypto</TabsTrigger>
                  <TabsTrigger value="sell" className="text-lg">Sell Crypto</TabsTrigger>
                </TabsList>

                <div className="space-y-6">
                  {/* Crypto Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tab === 'buy' ? 'Select Asset to Buy' : 'Select Asset to Sell'}
                    </label>
                    <Select value={selectedCrypto} onValueChange={(value) => {
                      setSelectedCrypto(value);
                      setShowRate(false);
                      setQuotation(null);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                            className="flex items-center gap-2"
                          >
                            <span className="font-mono">{currency.icon}</span>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Input Currency Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tab === 'buy' ? 'Choose Payment Method' : 'Receive Payment in'}
                    </label>
                    <Select value={inputCurrency} onValueChange={setInputCurrency}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INPUT_CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">
                          Enter Amount to {tab === 'buy' ? 'Buy' : 'Sell'} ({tab === 'buy' ? 'NGN' : selectedCrypto})
                        </label>
                        <button
                          onClick={handleMaxAmount}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Max
                        </button>
                      </div>
                      <Input
                        type="text"
                        value={formatInputAmount(amount)}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="text-lg"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-muted-foreground">
                          Available Balance: {tab === 'buy' 
                            ? formatCurrency(balances['NGN'] || '0', 'NGN')
                            : formatCryptoAmount(balances[selectedCrypto] || '0')} 
                        </span>
                      </div>
                    </div>

                    {rate && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-green-600">
                          Rate: 1 {selectedCrypto} = {getDisplayRate()} NGN
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            You {tab === 'buy' ? 'Receive' : 'Get'} ({tab === 'buy' ? selectedCrypto : 'NGN'})
                          </label>
                          <div className="mt-1 text-lg font-semibold">
                            {tab === 'buy'
                              ? formatCryptoAmount(quotation?.to_amount || '0')
                              : formatCurrency(quotation?.to_amount || '0', 'NGN')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ≈ {tab === 'buy'
                              ? formatCryptoAmount(quotation?.to_amount || '0')
                              : formatCurrency(quotation?.to_amount || '0', 'NGN')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estimated Amount */}
                  <AnimatePresence mode="wait">
                    {showRate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium">
                          {tab === 'buy' ? `You Receive (${selectedCrypto})` : `You Receive (NGN)`}
                        </label>
                        <motion.div 
                          className="p-4 bg-muted/50 rounded-lg"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-2xl font-semibold">
                            {tab === 'buy' 
                              ? formatCryptoAmount(quotation?.to_amount || '0')
                              : formatCurrency(quotation?.to_amount || '0', 'NGN')}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            ≈ {formatCurrency(
                              parseFloat(quotation?.to_amount || '0'),
                              tab === 'buy' ? selectedCrypto : 'NGN'
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={showRate ? () => setShowConfirmation(true) : handleProceed}
                    disabled={loading || quoting || !amount}
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

          {/* Trading Options Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TRADING_OPTIONS.map((option) => (
              <Link key={option.id} href={option.href}>
                <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <option.icon className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                          {option.title}
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {option.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
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
                  ? formatCryptoAmount(quotation?.to_amount || '0')
                  : formatCurrency(quotation?.to_amount || '0', 'NGN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rate</span>
              <span className="font-medium">
                1 {selectedCrypto} = {formatRate(rate || '0', {
                  inputCurrency: selectedCrypto,
                  outputCurrency: 'NGN'
                })} NGN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Info className="h-4 w-4" />
            <Link href="/trade/guide" className="hover:text-primary hover:underline">
              View our trading guide for fee tiers and limits
            </Link>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrade} disabled={loading || !quotation}>
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

      {feeConfig && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Your Trading Fees</h3>
          <div className="space-y-2 text-sm">
            <p>Current Tier: {feeConfig.user_tier.tier_level}</p>
            <p>Fee Rate: {feeConfig.user_tier.fee_percentage}%</p>
            <p>30-day Volume: {formatCurrency(feeConfig.user_tier.trading_volume, 'USD')}</p>
            {feeConfig.user_tier.next_tier && (
              <p className="text-green-600">
                Trade {formatCurrency(feeConfig.user_tier.next_tier.min - feeConfig.user_tier.trading_volume, 'USD')} more to reach next tier ({feeConfig.user_tier.next_tier.fee}% fee)
              </p>
            )}
            {feeConfig.referral_discount > 0 && (
              <p className="text-green-600">
                Referral Discount: {feeConfig.referral_discount}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 