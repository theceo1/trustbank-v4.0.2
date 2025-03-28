'use client';

import { useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDownUp, Repeat, Wallet, AlertCircle } from "lucide-react";
import { useQuidaxAPI } from '@/hooks/useQuidaxAPI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCryptoAmount, formatNairaAmount } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";

interface WalletType {
  id: string;
  currency: string;
  balance: string;
  estimated_value?: number;
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
}

interface CurrencyPair {
  value: string;
  label: string;
  icon: string;
}

interface QuoteState {
  id: string;
  rate: number;
  fee: number;
  network_fee: number;
  total: number;
  quote_amount: string;
}

interface InstantSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletType;
}

const TRADE_LIMITS = {
  MIN_NGN: 1000, // Minimum 1,000 NGN
  MAX_NGN: 10000000, // Maximum 10M NGN
  MIN_CRYPTO: {
    BTC: 0.0001,
    ETH: 0.01,
    USDT: 10,
    USDC: 10,
    DOGE: 100,
    TRUMP: 100,
  },
  MAX_CRYPTO: {
    BTC: 100,
    ETH: 1000,
    USDT: 100000,
    USDC: 100000,
    DOGE: 1000000,
    TRUMP: 1000000,
  }
};

const CURRENCY_PAIRS = [
  { value: 'BTC', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', icon: 'Ξ' },
  { value: 'USDT', label: 'Tether (USDT)', icon: '₮' },
  { value: 'USDC', label: 'USD Coin (USDC)', icon: '$' },
  { value: 'DOGE', label: 'Dogecoin (DOGE)', icon: 'Ð' },
  { value: 'TRUMP', label: 'TrumpCoin (TRUMP)', icon: '🇺🇸' },
];

function TradePreviewModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trade,
  countdown,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  trade: TradeDetails;
  countdown: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Trade Details</DialogTitle>
          <DialogDescription>
            Quote expires in {countdown} seconds
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Trade Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-lg font-semibold text-center mb-2">Trade Summary</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>You Pay</span>
                <div className="text-right">
                  <div className="font-medium">₦{formatNairaAmount(trade.ngn_equivalent)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCryptoAmount(trade.amount)} {trade.currency}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>You Receive</span>
                <div className="text-right">
                  <div className="font-medium">{formatCryptoAmount(trade.quote_amount)} {trade.currency}</div>
                  <div className="text-sm text-muted-foreground">
                    ≈ ₦{formatNairaAmount(Number(trade.quote_amount) * trade.rate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm font-medium mb-2">Exchange Rate</div>
            <div className="text-lg font-semibold">
              1 {trade.currency} = ₦{formatNairaAmount(trade.rate)}
            </div>
          </div>

          {/* Fees Breakdown */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Fees Breakdown</div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Service Fee (3%)</span>
                <span>₦{formatNairaAmount(trade.fees.service)}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee</span>
                <span>₦{formatNairaAmount(trade.fees.platform)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                <span>Total Fees</span>
                <span>₦{formatNairaAmount(trade.fees.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="text-center">
              <p className={`text-sm text-gray-500 ${countdown <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                Quote expires in{' '}
                <span className={`font-medium ${countdown <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                  {countdown}s
                </span>
              </p>
            </div>
            <Button
              onClick={onConfirm}
              disabled={countdown === 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {countdown === 0 ? 'Quote Expired' : 'Confirm Trade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InstantSwapModal({ isOpen, onClose, wallet }: InstantSwapModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>(wallet?.currency || '');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [inputCurrency, setInputCurrency] = useState<'CRYPTO' | 'NGN' | 'USD'>('CRYPTO');
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [showTradePreview, setShowTradePreview] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [quidaxId, setQuidaxId] = useState('');
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  const { toast } = useToast();
  const { createSwapQuotation, confirmSwapQuotation } = useQuidaxAPI();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Filter available currencies based on non-zero balances
  const availableCurrencies = useMemo(() => 
    availableWallets
      .filter(w => parseFloat(w.balance) > 0)
      .map(w => w.currency),
    [availableWallets]
  );

  // Filter available currencies based on user balances and ensure unique keys
  const fromCurrencyOptions = Array.from(new Set(
    availableCurrencies.length > 0 
      ? availableCurrencies 
      : CURRENCY_PAIRS.map(p => p.value)
  ));

  // Filter to currencies based on search and show all toggle
  const toCurrencyOptions: CurrencyPair[] = CURRENCY_PAIRS
    .filter(pair => {
      if (pair.value === fromCurrency) return false;
      if (!searchQuery) return true;
      return pair.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
             pair.value.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Get market rate for currency pair
  const getMarketRate = async (from: string, to: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 1;

      const response = await fetch(`/api/markets/rate?from=${from}&to=${to}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      return data.rate || 1;
    } catch (error) {
      console.error('Error fetching market rate:', error);
      return 1;
    }
  };

  // Update rate when currencies change
  useEffect(() => {
    const fetchRate = async () => {
      if (fromCurrency && toCurrency) {
        const newRate = await getMarketRate(fromCurrency, toCurrency);
        setQuote((prev: QuoteState | null) => prev ? { ...prev, rate: newRate } : null);
      }
    };
    fetchRate();
  }, [fromCurrency, toCurrency]);

  // Calculate NGN equivalent
  const calculateNGNEquivalent = (amount: string, currency: string): number => {
    if (!amount || !currency) return 0;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    const rate = quote?.rate || 1;
    return currency === 'NGN' ? numAmount : numAmount * rate;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      fetchUserBalance();
    }
  };

  const fetchUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: balances, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAvailableWallets(balances);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quote && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev: number) => {
          if (prev <= 1) {
            setIsQuoteExpired(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quote]);

  const getCurrentRate = useCallback(() => {
    if (!quote) return 1;
    return quote.rate;
  }, [quote]);

  const convertAmount = (value: string, isNaira: boolean) => {
    const rate = getCurrentRate();
    const numValue = Number(value);
    return isNaira ? numValue / rate : numValue * rate;
  };

  const validateAmount = (value: string): string | null => {
    const numValue = Number(value);
    if (inputCurrency === 'NGN') {
      if (numValue < TRADE_LIMITS.MIN_NGN) {
        return `Minimum amount is ₦${formatNairaAmount(TRADE_LIMITS.MIN_NGN)}`;
      }
      if (numValue > TRADE_LIMITS.MAX_NGN) {
        return `Maximum amount is ₦${formatNairaAmount(TRADE_LIMITS.MAX_NGN)}`;
      }
    } else if (inputCurrency === 'CRYPTO') {
      const minCrypto = TRADE_LIMITS.MIN_CRYPTO[fromCurrency as keyof typeof TRADE_LIMITS.MIN_CRYPTO];
      if (numValue < minCrypto) {
        return `Minimum amount is ${minCrypto} ${fromCurrency}`;
      }
      const maxCrypto = TRADE_LIMITS.MAX_CRYPTO[fromCurrency as keyof typeof TRADE_LIMITS.MAX_CRYPTO];
      if (numValue > maxCrypto) {
        return `Maximum amount is ${maxCrypto} ${fromCurrency}`;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchQuidaxId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('quidax_id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setQuidaxId(profile?.quidax_id || '');
      } catch (err) {
        console.error('Error fetching Quidax ID:', err);
        setError('Failed to fetch user profile');
      }
    };

    fetchQuidaxId();
  }, [supabase]);

  const handleGetQuote = async () => {
    if (!quidaxId) {
      setError('Please complete your profile setup first');
      return;
    }

    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setQuote(null);
      setIsQuoteExpired(false);
      setCountdown(14);

      const cryptoAmount = inputCurrency === 'NGN' ? convertAmount(amount, true).toString() : amount;
      const result = await createSwapQuotation({
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: cryptoAmount,
        user_id: quidaxId,
      });

      if (result.status === 'success' && result.data) {
        setQuote(result.data);
        setShowTradePreview(true);
      } else {
        throw new Error(result.message || 'Failed to get quote');
      }
    } catch (err) {
      console.error('Error getting quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    // Convert amount based on input currency
    if (inputCurrency === 'USD') {
      // Convert USD to crypto using approximate rate
      // This is a placeholder - you should use actual rates
      const usdRate = 1585.23; // Example USD/NGN rate
      const cryptoAmount = (parseFloat(value) * usdRate) / getCurrentRate();
      // Update state or UI as needed
    }
  };

  const handleMaxAmount = () => {
    if (!availableWallets) return;
    const maxAmount = inputCurrency === 'NGN' 
      ? availableWallets.find((b: any) => b.currency === 'NGN')?.balance || '0'
      : availableWallets.find((b: any) => b.currency === fromCurrency)?.balance || '0';
    setAmount(maxAmount.toString());
  };

  const handleClose = () => {
    setQuote(null);
    setAmount('');
    setCountdown(14);
    setShowTradePreview(false);
    onClose();
  };

  const handleConfirmSwap = async () => {
    if (!quote || isQuoteExpired) return;

    try {
      setIsConfirming(true);
      setError(null);

      const result = await confirmSwapQuotation({
        quotation_id: quote.id,
        from_currency: fromCurrency.toLowerCase(),
        to_currency: toCurrency.toLowerCase(),
        from_amount: amount,
        user_id: quidaxId,
      });

      if (result.status === 'success' && result.data) {
        toast({
          title: "Success",
          description: "Swap confirmed successfully!",
        });
        onClose();
      } else {
        throw new Error(result.message || 'Failed to confirm swap');
      }
    } catch (err) {
      console.error('Error confirming swap:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm swap');
    } finally {
      setIsConfirming(false);
    }
  };

  // Display available balance in NGN equivalent
  const renderAvailableBalance = () => {
    if (!isAuthenticated || !availableWallets) return null;
    
    const currentBalance = availableWallets.find((b: any) => 
      b.currency.toUpperCase() === fromCurrency.toUpperCase()
    );
    
    const balanceAmount = currentBalance ? parseFloat(currentBalance.balance) : 0;
    const ngnEquivalent = calculateNGNEquivalent(balanceAmount.toString(), fromCurrency);
    
    return (
      <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4" />
          <span>Available Balance:</span>
          <span className="font-medium text-green-600 dark:text-green-500">
            {formatCryptoAmount(balanceAmount)} {fromCurrency}
            {fromCurrency !== 'NGN' && ngnEquivalent > 0 && (
              <span className="ml-1 text-gray-500">
                (≈ {formatNairaAmount(ngnEquivalent)})
              </span>
            )}
          </span>
        </div>
      </div>
    );
  };

  const renderCurrencyOption = (currency: string): ReactNode => {
    const pair = CURRENCY_PAIRS.find(p => p.value === currency);
    if (!pair) return null;
    return (
      <SelectItem key={`source-${currency}`} value={currency}>
        <span className="flex items-center gap-2">
          <span>{pair.icon}</span>
          {pair.label}
          {availableCurrencies.includes(currency) && (
            <span className="ml-auto text-xs text-green-600">
              Available
            </span>
          )}
        </span>
      </SelectItem>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Instant Swap</DialogTitle>
            <DialogDescription className="text-base">
              Instantly swap between cryptocurrencies at the best rates.
            </DialogDescription>
          </DialogHeader>

          {renderAvailableBalance()}

          <div className="space-y-6">
            {/* From Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">From</Label>
              <Select 
                value={fromCurrency} 
                onValueChange={setFromCurrency}
              >
                <SelectTrigger className="h-12 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {(availableCurrencies.length > 0 ? availableCurrencies : fromCurrencyOptions)
                    .map(renderCurrencyOption)}
                </SelectContent>
              </Select>
            </div>

            {/* Amount with currency selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Amount</Label>
                <Select 
                  value={inputCurrency} 
                  onValueChange={(value: any) => setInputCurrency(value)}
                >
                  <SelectTrigger className="w-[110px] h-8 text-sm bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRYPTO">{fromCurrency}</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={
                    inputCurrency === 'NGN' ? '₦0.00' :
                    inputCurrency === 'USD' ? '$0.00' :
                    '0.00'
                  }
                  className="h-12 bg-white dark:bg-gray-800 pr-16"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                  onClick={handleMaxAmount}
                >
                  MAX
                </Button>
              </div>
              {amount && (
                <p className="text-sm text-green-600 dark:text-green-500">
                  ≈ ₦{formatNairaAmount(calculateNGNEquivalent(amount, fromCurrency))}
                </p>
              )}
            </div>

            {/* To Currency with search */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">To</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCurrencies(!showAllCurrencies)}
                  className="text-xs text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                >
                  {showAllCurrencies ? 'Show Less' : 'Show More'}
                </Button>
              </div>
              
              {showAllCurrencies && (
                <div className="relative">
                  <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search currencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-white dark:bg-gray-800 mb-2"
                  />
                </div>
              )}

              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="h-12 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {toCurrencyOptions.map((pair) => (
                    <SelectItem key={`target-${pair.value}`} value={pair.value}>
                      <span className="flex items-center gap-2">
                        <span>{pair.icon}</span>
                        {pair.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rate Info */}
            {fromCurrency && toCurrency && quote?.rate && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
                <Icons.info className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  1 {fromCurrency} ≈ {formatNairaAmount(quote.rate)} {toCurrency}
                  {amount && (
                    <div className="mt-1 text-sm text-green-600/80 dark:text-green-400/80">
                      ≈ ₦{formatNairaAmount(calculateNGNEquivalent(amount, fromCurrency))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGetQuote} 
              disabled={loading || !amount || !fromCurrency || !toCurrency}
              className="h-11 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Quote...
                </>
              ) : !isAuthenticated ? (
                'Proceed to Sign In'
              ) : (
                'Get Quote'
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} className="h-11">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {quote && (
        <TradePreviewModal
          isOpen={showTradePreview}
          onClose={() => setShowTradePreview(false)}
          onConfirm={handleConfirmSwap}
          trade={{
            type: 'swap',
            amount: amount,
            currency: fromCurrency,
            rate: quote.rate || 1,
            fees: {
              service: quote.fee * (quote.rate || 1) * 0.03,
              platform: quote.network_fee || 0,
              total: (quote.fee * (quote.rate || 1) * 0.03) + (quote.network_fee || 0),
            },
            total: quote.total * (quote.rate || 1),
            quote_amount: quote.quote_amount,
            ngn_equivalent: calculateNGNEquivalent(amount, fromCurrency),
          }}
          countdown={countdown}
        />
      )}
    </>
  );
} 