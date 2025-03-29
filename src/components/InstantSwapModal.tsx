'use client';

import { useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDownUp, Repeat, Wallet, AlertCircle, Circle } from "lucide-react";
import { useQuidaxAPI } from '@/hooks/useQuidaxAPI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCryptoAmount, formatNairaAmount } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

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
  icon: JSX.Element;
}

interface Currency {
  value: string;
  label: string;
}

interface QuoteState {
  id: string;
  rate: number;
  fee: number;
  network_fee: number;
  total: number;
  quote_amount: string;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { value: 'NGN', label: 'Nigerian Naira' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'USDT', label: 'Tether' },
  { value: 'USDC', label: 'USD Coin' },
  { value: 'BNB', label: 'Binance Coin' },
  { value: 'SOL', label: 'Solana' },
  { value: 'MATIC', label: 'Polygon' },
  { value: 'XRP', label: 'Ripple' },
  { value: 'DOGE', label: 'Dogecoin' },
  { value: 'ADA', label: 'Cardano' },
  { value: 'DOT', label: 'Polkadot' },
  { value: 'LTC', label: 'Litecoin' },
  { value: 'LINK', label: 'Chainlink' },
  { value: 'BCH', label: 'Bitcoin Cash' },
  { value: 'AAVE', label: 'Aave' },
  { value: 'ALGO', label: 'Algorand' },
  { value: 'NEAR', label: 'NEAR Protocol' },
  { value: 'FIL', label: 'Filecoin' },
  { value: 'SAND', label: 'The Sandbox' },
  { value: 'MANA', label: 'Decentraland' },
  { value: 'APE', label: 'ApeCoin' },
  { value: 'SHIB', label: 'Shiba Inu' },
  { value: 'SUI', label: 'Sui' },
  { value: 'INJ', label: 'Injective' },
  { value: 'ARB', label: 'Arbitrum' },
  { value: 'TON', label: 'Toncoin' },
  { value: 'RNDR', label: 'Render Token' },
  { value: 'STX', label: 'Stacks' },
  { value: 'GRT', label: 'The Graph' }
];

interface InstantSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletType;
}

type AmountCurrencyType = 'CRYPTO' | 'NGN' | 'USD';

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

// Format amount with proper decimal places
const formatAmount = (amount: string, currency: string): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  
  // Use 8 decimal places for crypto, 2 for fiat
  const decimals = ['USD', 'NGN'].includes(currency.toUpperCase()) ? 2 : 8;
  return num.toFixed(decimals);
};

// Add this helper function at the top of the file
const getCurrencyIcon = (currency: string): JSX.Element => {
  switch (currency.toUpperCase()) {
    case 'BTC':
      return <Icons.bitcoin className="h-4 w-4" />;
    case 'ETH':
      return <Icons.ethereum className="h-4 w-4" />;
    case 'USDT':
      return <Icons.dollar className="h-4 w-4" />;
    case 'NGN':
      return <Icons.naira className="h-4 w-4" />;
    case 'USD':
      return <Icons.dollar className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

// Add this helper function near the top with other utility functions
const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    ADA: 'Cardano',
    DOT: 'Polkadot',
    LTC: 'Litecoin',
    LINK: 'Chainlink',
    BCH: 'Bitcoin Cash',
    NGN: 'Nigerian Naira'
  };
  return names[currency.toUpperCase()] || currency.toUpperCase();
};

export function InstantSwapModal({ isOpen, onClose, wallet }: InstantSwapModalProps) {
  const [fromCurrency, setFromCurrency] = useState<string>(wallet?.currency || '');
  const [toCurrency, setToCurrency] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [amountCurrency, setAmountCurrency] = useState<AmountCurrencyType>('CRYPTO');
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [quidaxId, setQuidaxId] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showTradePreview, setShowTradePreview] = useState(false);
  const { toast } = useToast();

  // Compute if form is valid
  const isValid = Boolean(amount && fromCurrency && toCurrency && !error);

  const getWalletBalance = (currency: string): string => {
    const wallet = wallets.find(w => w.currency.toLowerCase() === currency.toLowerCase());
    return wallet?.balance || '0';
  };

  // Filter to-currencies based on search and exclude the from-currency
  const filteredToCurrencies = useMemo(() => 
    availableCurrencies.filter(pair => {
      if (pair.value === fromCurrency) return false;
      if (!toSearchQuery) return true;
      return (
        pair.value.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
        pair.label.toLowerCase().includes(toSearchQuery.toLowerCase())
      );
    }),
    [availableCurrencies, fromCurrency, toSearchQuery]
  );

  const { createSwapQuotation, confirmSwapQuotation } = useQuidaxAPI();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch user wallets and balances
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session found');

        const response = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch wallets');
        const data = await response.json();
        
        // Filter wallets to only include those with positive balances
        const walletsWithBalance = data.wallets.filter(
          (w: WalletType) => parseFloat(w.balance) > 0
        );
        
        setWallets(walletsWithBalance);
        setAvailableWallets(walletsWithBalance);
        
        // Set available currencies from wallets with balance
        const currencies = walletsWithBalance.map((w: WalletType) => w.currency);
        setAvailableCurrencies(currencies.map((currency: string) => ({
          value: currency,
          label: currency.toUpperCase(),
          icon: getCurrencyIcon(currency)
        })));
      } catch (error) {
        console.error('Error fetching wallets:', error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balances",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchWallets();
    }
  }, [isOpen, toast, supabase]);

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    return availableCurrencies.filter(currency =>
      currency.value.toLowerCase().includes(fromSearchQuery.toLowerCase())
    );
  }, [availableCurrencies, fromSearchQuery]);

  // Render currency option with balance
  const renderCurrencyOption = (currency: string): ReactNode => {
    const balance = getWalletBalance(currency);
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="font-medium">{currency.toUpperCase()}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          Balance: {formatAmount(balance, currency)}
        </div>
      </div>
    );
  };

  // Filter available currencies based on user balances and ensure unique keys
  const fromCurrencyOptions = Array.from(new Set(
    availableCurrencies.map(c => c.value)
  ));

  // Filter to currencies based on search and show all toggle
  const toCurrencyOptions: CurrencyPair[] = availableCurrencies
    .filter(pair => {
      if (pair.value === fromCurrency) return false;
      if (!toSearchQuery) return true;
      return pair.label.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
             pair.value.toLowerCase().includes(toSearchQuery.toLowerCase());
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Response was not JSON");
      }

      const data = await response.json();
      if (!data || typeof data.rate !== 'number') {
        throw new Error('Invalid rate data received');
      }

      return data.rate;
    } catch (error) {
      console.error('Error fetching market rate:', error);
      // Return a fallback rate of 1 in case of error
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
    
    // If the currency is already NGN, return the amount
    if (currency === 'NGN') return numAmount;

    // Get the market rate for the currency to NGN
    const marketData = wallets.find(w => w.currency === currency);
    if (!marketData?.estimated_value) return 0;

    // Calculate the NGN value using the estimated value
    const rate = marketData.estimated_value / parseFloat(marketData.balance);
    return numAmount * rate;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
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
      setWallets(balances);
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
    if (amountCurrency === 'NGN') {
      if (numValue < TRADE_LIMITS.MIN_NGN) {
        return `Minimum amount is ₦${formatNairaAmount(TRADE_LIMITS.MIN_NGN)}`;
      }
      if (numValue > TRADE_LIMITS.MAX_NGN) {
        return `Maximum amount is ₦${formatNairaAmount(TRADE_LIMITS.MAX_NGN)}`;
      }
    } else if (amountCurrency === 'CRYPTO') {
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
      setIsLoading(true);
      setError(null);
      setQuote(null);
      setIsQuoteExpired(false);
      setCountdown(14);

      const cryptoAmount = amountCurrency === 'NGN' ? convertAmount(amount, true).toString() : amount;
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
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    // Convert amount based on input currency
    if (amountCurrency === 'USD') {
      // Convert USD to crypto using approximate rate
      // This is a placeholder - you should use actual rates
      const usdRate = 1585.23; // Example USD/NGN rate
      const cryptoAmount = (parseFloat(value) * usdRate) / getCurrentRate();
      // Update state or UI as needed
    }
  };

  const handleMaxAmount = () => {
    if (!wallets) return;
    const maxAmount = amountCurrency === 'NGN' 
      ? wallets.find((b: any) => b.currency === 'NGN')?.balance || '0'
      : wallets.find((b: any) => b.currency === fromCurrency)?.balance || '0';
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
    if (!wallets) return null;
    
    const currentBalance = wallets.find((b: any) => 
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

  const handleAmountCurrencyChange = (value: AmountCurrencyType) => {
    setAmountCurrency(value);
    // Reset amount when changing currency type
    setAmount('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-orange-50 dark:bg-orange-900/90 border-0">
        <DialogHeader>
          <DialogTitle>Instant Swap</DialogTitle>
          <DialogDescription>
            Instantly swap between cryptocurrencies at the best rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Section */}
          <div className="space-y-2">
            <Label>From</Label>
            <Select
              value={fromCurrency}
              onValueChange={setFromCurrency}
            >
              <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border shadow-sm">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.currency} 
                    value={wallet.currency}
                    className="hover:bg-green-600 hover:text-white transition-colors"
                  >
                    <span className="font-medium">{wallet.currency.toUpperCase()}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderAvailableBalance()}
          </div>

          {/* Amount Section */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <Input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pr-24 h-12 bg-white dark:bg-gray-800"
                placeholder={`Enter amount in ${amountCurrency === 'CRYPTO' ? fromCurrency : amountCurrency}`}
              />
              <Select
                value={amountCurrency}
                onValueChange={handleAmountCurrencyChange}
              >
                <SelectTrigger className="absolute right-0 top-0 h-full w-24 border-l bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  {fromCurrency && (
                    <SelectItem 
                      value="CRYPTO"
                      className="hover:bg-green-600 hover:text-white transition-colors"
                    >
                      {fromCurrency}
                    </SelectItem>
                  )}
                  <SelectItem 
                    value="NGN"
                    className="hover:bg-green-600 hover:text-white transition-colors"
                  >
                    NGN
                  </SelectItem>
                  <SelectItem 
                    value="USD"
                    className="hover:bg-green-600 hover:text-white transition-colors"
                  >
                    USD
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <Label>To</Label>
            <Select
              value={toCurrency}
              onValueChange={setToCurrency}
            >
              <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border shadow-sm">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 max-h-[200px] overflow-hidden">
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b">
                  <Input
                    type="text"
                    placeholder="Search currencies..."
                    value={toSearchQuery}
                    onChange={(e) => setToSearchQuery(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="overflow-y-auto max-h-[160px]">
                  {SUPPORTED_CURRENCIES
                    .filter(currency => 
                      currency.value.toLowerCase() !== fromCurrency?.toLowerCase() &&
                      (currency.value.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
                       currency.label.toLowerCase().includes(toSearchQuery.toLowerCase()))
                    )
                    .map((currency) => (
                      <SelectItem 
                        key={currency.value} 
                        value={currency.value}
                        className="hover:bg-green-600 hover:text-white transition-colors"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{currency.value}</span>
                          <span className="text-muted-foreground">
                            {currency.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleGetQuote}
            disabled={!isValid || isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : (
              'Get Quote'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {quote && (
        <TradePreviewModal
          isOpen={showTradePreview}
          onClose={() => setShowTradePreview(false)}
          onConfirm={handleConfirmSwap}
          trade={{
            type: 'swap',
            amount: amount,
            currency: fromCurrency,
            rate: quote.rate,
            fees: {
              total: quote.fee + quote.network_fee,
              platform: quote.fee,
              service: quote.network_fee
            },
            total: quote.total,
            quote_amount: quote.quote_amount,
            ngn_equivalent: calculateNGNEquivalent(amount, fromCurrency)
          }}
          countdown={countdown}
        />
      )}
    </Dialog>
  );
} 