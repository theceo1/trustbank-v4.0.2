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
import { cn } from '@/lib/utils';
import { TradePreviewModal } from '@/components/InstantSwapModal';

// Fee tiers based on 30-day trading volume (in USD)
const VOLUME_TIERS = {
  TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
  TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
  TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
  TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
  TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
};

// Minimum amounts for each currency
const AMOUNT_LIMITS = {
  USDT: { min: 0.1 },
  NGN: { min: 1000 }
};

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
  disabled?: boolean;
}

interface SwapQuotation {
  id: string;
  from_currency: string;
  to_currency: string;
  quoted_price: string;
  from_amount: string;
  to_amount: string;
  expires_at: string;
  fees: {
    trading: number;
    network: number;
  };
  total: number;
}

export default function PlaceOrder({ market, lastPrice, baseAsset, quoteAsset, disabled }: PlaceOrderProps) {
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
  const [trade, setTrade] = useState<any>(null);

  // Fetch wallet balances
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

  useEffect(() => {
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

  // Add helper function for number format detection
  const isFiatFormat = (value: string): boolean => {
    return value.includes(',') || (!value.includes('.') && parseFloat(value) >= 1000);
  };

  const handleTrade = async () => {
    try {
      setSwapLoading(true);
      setError(null);

      // Validate amount
      if (!amount || isNaN(parseFloat(amount.replace(/,/g, '')))) {
        throw new Error('Please enter a valid amount');
      }

      const fromCurrency = side === 'buy' ? quoteAsset : baseAsset;
      const toCurrency = side === 'buy' ? baseAsset : quoteAsset;
      
      // Get current NGN/USDT rate for calculations
      const ngnUsdtResponse = await fetch('/api/markets/rate?from=USDT&to=NGN');
      if (!ngnUsdtResponse.ok) {
        throw new Error('Failed to fetch NGN/USDT rate');
      }
      const ngnUsdtData = await ngnUsdtResponse.json();
      const ngnUsdtRate = ngnUsdtData.rate;

      // Parse amount removing any commas
      const parsedAmount = parseFloat(amount.replace(/,/g, ''));
      
      // Calculate amounts based on side and format
      let fromAmount: string;
      let ngnEquivalent: number;

      if (side === 'buy') {
        // For buy, amount is in NGN
        fromAmount = parsedAmount.toString();
        ngnEquivalent = parsedAmount;
      } else {
        const isNgnInput = isFiatFormat(amount);
        
        if (isNgnInput) {
          // Input is in NGN
          ngnEquivalent = parsedAmount;
          fromAmount = (ngnEquivalent / ngnUsdtRate).toFixed(8);
        } else {
          // Input is in crypto
          fromAmount = parsedAmount.toString();
          ngnEquivalent = parsedAmount * ngnUsdtRate;
        }
      }

      // Check minimum amount based on currency
      const minAmount = (AMOUNT_LIMITS as any)[fromCurrency]?.min || 0;
      if (parseFloat(fromAmount) < minAmount) {
        throw new Error(
          `Minimum trade amount for ${fromCurrency} is ${minAmount} ${fromCurrency}` +
          (fromCurrency === 'USDT' ? ` (≈₦${formatNumber(minAmount * ngnUsdtRate)})` : '')
        );
      }

      // Check minimum NGN equivalent
      if (ngnEquivalent < AMOUNT_LIMITS.NGN.min) {
        throw new Error(
          `Trade amount is too small. Minimum trade value is ₦${formatNumber(AMOUNT_LIMITS.NGN.min)}. ` +
          `Your trade value: ₦${formatNumber(ngnEquivalent)}`
        );
      }

      // Get swap quotation
      console.log('Requesting quote with:', {
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: fromAmount
      });

      const quotationResponse = await fetch('/api/swap/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: fromCurrency.toLowerCase(),
          to_currency: toCurrency.toLowerCase(),
          from_amount: fromAmount
        })
      });

      if (!quotationResponse.ok) {
        const errorData = await quotationResponse.json();
        throw new Error(errorData.error || errorData.message || 'Failed to get swap quotation');
      }

      const { data: quotationData } = await quotationResponse.json();
      
      // Calculate USD equivalent for fee tier
      const usdEquivalent = ngnEquivalent / ngnUsdtRate;
      
      // Determine fee tier based on USD amount
      let feeTier = VOLUME_TIERS.TIER_1;
      for (const tier of Object.values(VOLUME_TIERS)) {
        if (usdEquivalent >= tier.min && usdEquivalent < tier.max) {
          feeTier = tier;
          break;
        }
      }

      // Calculate trading fee based on NGN equivalent
      const tradingFee = (ngnEquivalent * feeTier.fee) / 100;

      // Validate that the trade is still profitable after fees
      const netAmount = ngnEquivalent - tradingFee;
      if (netAmount <= 0) {
        throw new Error(
          'Trade amount is too small after fees. ' +
          `Fee: ₦${formatNumber(tradingFee)} (${feeTier.fee}%). ` +
          'Please increase your trade amount.'
        );
      }
      
      // Set trade data for preview
      setTrade({
        type: 'swap',
        amount: fromAmount,
        currency: fromCurrency,
        rate: parseFloat(quotationData.quoted_price),
        fees: {
          total: tradingFee,
          platform: tradingFee,
          network: 0 // No network fee for market orders
        },
        total: ngnEquivalent + tradingFee,
        quote_amount: quotationData.to_amount,
        ngn_equivalent: ngnEquivalent,
        quotation_id: quotationData.id
      });
      
      setShowConfirmation(true);
      setTimeLeft(14); // Reset countdown
    } catch (err) {
      console.error('Trade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create swap quotation');
    } finally {
      setSwapLoading(false);
    }
  };

  // Update amount input handler to format numbers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Format with commas if it's a whole number >= 1000
      if (isFiatFormat(value)) {
        setAmount(formatNumber(parseFloat(value)));
      } else {
        setAmount(value);
      }
    }
  };

  // Add useEffect for countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirmation && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowConfirmation(false);
            setTrade(null);
            return 14;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showConfirmation, timeLeft]);

  return (
    <Card className="p-4">
      <Tabs value={orderType} onValueChange={setOrderType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="market" 
            disabled={disabled}
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Market
          </TabsTrigger>
          <TabsTrigger 
            value="limit"
            disabled={disabled}
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Limit
          </TabsTrigger>
        </TabsList>

        <div className="bg-muted rounded-lg p-3 mb-4">
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
            className={cn(
              "w-full",
              side === 'buy' && "bg-green-600 hover:bg-green-700 text-white"
            )}
            disabled={disabled}
          >
            Buy
          </Button>
          <Button
            variant={side === 'sell' ? 'default' : 'outline'}
            onClick={() => setSide('sell')}
            className={cn(
              "w-full",
              side === 'sell' && "bg-red-600 hover:bg-red-700 text-white"
            )}
            disabled={disabled}
          >
            Sell
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-100 dark:bg-red-900/50 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Balance:</span>
            <div className="flex items-center gap-2">
              <Select value={balanceDisplay} onValueChange={(v: 'crypto' | 'usd' | 'ngn') => setBalanceDisplay(v)}>
                <SelectTrigger className="w-[100px] h-8 bg-white dark:bg-gray-800 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-purple-100 dark:bg-blue-900/90 border-2">
                  <SelectItem value="crypto" className="hover:bg-purple-200 dark:hover:bg-blue-800 cursor-pointer">Crypto</SelectItem>
                  <SelectItem value="usd" className="hover:bg-purple-200 dark:hover:bg-blue-800 cursor-pointer">USD</SelectItem>
                  <SelectItem value="ngn" className="hover:bg-purple-200 dark:hover:bg-blue-800 cursor-pointer">NGN</SelectItem>
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
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm">Amount ({baseAsset})</label>
            <div className="flex gap-2">
              <Input 
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={disabled}
              />
              <Button 
                variant="outline" 
                onClick={handleMaxAmount}
                className="whitespace-nowrap"
                disabled={disabled}
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
            disabled={!amount || (orderType === 'limit' && !price) || loading || swapLoading || disabled}
          >
            {swapLoading ? 'Processing...' : side === 'buy' ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
          </Button>
        </div>
      </Tabs>

      {trade && (
        <TradePreviewModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setTrade(null);
          }}
          onConfirm={async () => {
            try {
              setSwapLoading(true);
              const response = await fetch(`/api/swap/quotation/${trade.quotation_id}/confirm`, {
                method: 'POST'
              });

              if (!response.ok) {
                throw new Error('Failed to confirm trade');
              }

              // Reset form after successful trade
              setAmount('');
              setPrice(lastPrice || '');
              setShowConfirmation(false);
              setTrade(null);
              
              // Refresh wallet balances
              fetchWallets();
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to confirm trade');
            } finally {
              setSwapLoading(false);
            }
          }}
          trade={trade}
          toCurrency={side === 'buy' ? baseAsset : quoteAsset}
          countdown={14}
          setAmount={setAmount}
          setError={setError}
          setShowPreview={setShowConfirmation}
        />
      )}
    </Card>
  );
} 