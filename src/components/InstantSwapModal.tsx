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
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';

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
  quotation_id: string;
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
  { value: 'USD', label: 'US Dollar' },
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
  { value: 'GRT', label: 'The Graph' },
  { value: 'TRUMP', label: 'Trump Token' },
  { value: 'UNI', label: 'Uniswap' },
  { value: 'AVAX', label: 'Avalanche' },
  { value: 'ATOM', label: 'Cosmos' },
  { value: 'CAKE', label: 'PancakeSwap' },
  { value: 'COMP', label: 'Compound' },
  { value: 'CRV', label: 'Curve DAO' },
  { value: 'DAI', label: 'Dai' },
  { value: 'ENJ', label: 'Enjin Coin' },
  { value: 'FTM', label: 'Fantom' },
  { value: 'GALA', label: 'Gala' },
  { value: 'HBAR', label: 'Hedera' },
  { value: 'ICP', label: 'Internet Computer' },
  { value: 'KCS', label: 'KuCoin Token' },
  { value: 'LDO', label: 'Lido DAO' },
  { value: 'MASK', label: 'Mask Network' },
  { value: 'MKR', label: 'Maker' },
  { value: 'NEO', label: 'NEO' },
  { value: 'ONE', label: 'Harmony' },
  { value: 'OP', label: 'Optimism' },
  { value: 'PEPE', label: 'Pepe' },
  { value: 'QNT', label: 'Quant' },
  { value: 'RUNE', label: 'THORChain' },
  { value: 'SNX', label: 'Synthetix' },
  { value: 'THETA', label: 'Theta Network' },
  { value: 'VET', label: 'VeChain' },
  { value: 'WAVES', label: 'Waves' },
  { value: 'XDC', label: 'XDC Network' },
  { value: 'XEC', label: 'eCash' },
  { value: 'XEM', label: 'NEM' },
  { value: 'XLM', label: 'Stellar' },
  { value: 'XTZ', label: 'Tezos' },
  { value: 'ZEC', label: 'Zcash' },
  { value: 'ZIL', label: 'Zilliqa' }
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
    USDT: 0.1, // Minimum 0.1 USDT
    USDC: 0.1,
    SOL: 0.01,
    // Add other currencies as needed
  },
  MAX_CRYPTO: {
    BTC: 10,
    ETH: 1000,
    USDT: 100000,
    USDC: 100000,
    SOL: 1000,
    // Add other currencies as needed
  }
};

// Update the currency display format
const formatCurrencyDisplay = (currency: string): string => {
  const currencyMap: Record<string, string> = {
    USDT: 'USDT (Tether)',
    BTC: 'BTC (Bitcoin)',
    ETH: 'ETH (Ethereum)',
    SOL: 'SOL (Solana)',
    MATIC: 'MATIC (Polygon)',
    XRP: 'XRP (Ripple)',
    DOGE: 'DOGE (Dogecoin)',
    ADA: 'ADA (Cardano)',
    DOT: 'DOT (Polkadot)',
    LTC: 'LTC (Litecoin)',
    LINK: 'LINK (Chainlink)',
    BCH: 'BCH (Bitcoin Cash)',
    AAVE: 'AAVE (Aave)',
    ALGO: 'ALGO (Algorand)',
    NEAR: 'NEAR (NEAR Protocol)',
    FIL: 'FIL (Filecoin)',
    SAND: 'SAND (The Sandbox)',
    MANA: 'MANA (Decentraland)',
    APE: 'APE (ApeCoin)',
    SHIB: 'SHIB (Shiba Inu)',
    SUI: 'SUI (Sui)',
    INJ: 'INJ (Injective)',
    ARB: 'ARB (Arbitrum)',
    TON: 'TON (Toncoin)',
    RNDR: 'RNDR (Render Token)',
    STX: 'STX (Stacks)',
    GRT: 'GRT (The Graph)'
  };
  return currencyMap[currency] || currency;
};

// Add helper function to validate limits
const validateLimits = (amount: string, currency: string, amountType: AmountCurrencyType): string | null => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 'Please enter a valid amount';

  if (amountType === 'NGN') {
    if (numAmount < TRADE_LIMITS.MIN_NGN) {
      return `Minimum amount is ₦${formatNairaAmount(TRADE_LIMITS.MIN_NGN)}`;
    }
    if (numAmount > TRADE_LIMITS.MAX_NGN) {
      return `Maximum amount is ₦${formatNairaAmount(TRADE_LIMITS.MAX_NGN)}`;
    }
  } else {
    const minAmount = TRADE_LIMITS.MIN_CRYPTO[currency as keyof typeof TRADE_LIMITS.MIN_CRYPTO];
    const maxAmount = TRADE_LIMITS.MAX_CRYPTO[currency as keyof typeof TRADE_LIMITS.MAX_CRYPTO];
    
    if (minAmount && numAmount < minAmount) {
      return `Minimum amount is ${minAmount} ${currency}`;
    }
    if (maxAmount && numAmount > maxAmount) {
      return `Maximum amount is ${maxAmount} ${currency}`;
    }
  }
  return null;
};

function TradePreviewModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trade,
  countdown,
  toCurrency,
  setAmount,
  setError,
  setShowPreview,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  trade: TradeDetails;
  countdown: number;
  toCurrency: string;
  setAmount: (value: string) => void;
  setError: (value: string | null) => void;
  setShowPreview: (value: boolean) => void;
}) {
  const handleClose = () => {
    onClose();
    setAmount('');
    setError(null);
    setShowPreview(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-950 via-orange-900 to-black border-orange-800/50">
        <DialogHeader>
          <DialogTitle>Confirm Swap</DialogTitle>
          <DialogDescription>
            Please review your swap details. This quote expires in {countdown} seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">
                      {formatCryptoAmount(trade.amount)} {trade.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">
                      {formatCryptoAmount(trade.quote_amount)} {toCurrency}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rate</span>
                    <span className="font-medium">₦{formatNairaAmount(trade.rate)}/{trade.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>NGN Equivalent</span>
                    <span className="font-medium">₦{formatNairaAmount(trade.ngn_equivalent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Trading Fee ({(trade.fees.total / trade.ngn_equivalent * 100).toFixed(1)}%)</span>
                    <span className="font-medium">₦{formatNairaAmount(trade.fees.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total Amount (incl. fees)</span>
                    <span>₦{formatNairaAmount(trade.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={countdown <= 0}>
            Confirm Swap
          </Button>
        </DialogFooter>
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

// Volume-based fee tiers
interface VolumeTier {
  min: number;
  max: number;
  fee: number;
}

const VOLUME_TIERS: Record<string, VolumeTier> = {
  TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
  TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
  TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
  TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
  TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
};

interface MarketRates {
  [key: string]: number;
}

// Add this function after the existing imports
const getMarketRate = async (from: string, to: string): Promise<number | null> => {
  try {
    const response = await fetch(`/api/markets/rate?from=${from}&to=${to}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market rate');
    }
    const data = await response.json();
    return data.rate || null;
  } catch (error) {
    console.error('Error fetching market rate:', error);
    return null;
  }
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
  const [countdown, setCountdown] = useState(14);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);
  const { toast } = useToast();
  const [marketRates, setMarketRates] = useState<MarketRates>({});
  const { session } = useAuth();
  const router = useRouter();
  const [feeConfig, setFeeConfig] = useState<any>(null);

  const resetForm = useCallback(() => {
    setAmount('');
    setShowPreview(false);
    setTradeDetails(null);
    setQuote(null);
    setCountdown(14);
    setError(null);
    setIsLoading(false);
  }, []);

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
    const rate = marketRates[`${currency}/NGN`] || marketRates[`${currency}/USDT`] * marketRates['USDT/NGN'];
    return parseFloat(amount) * rate;
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
        return `Minimum amount is ${formatCryptoAmount(minCrypto)} ${fromCurrency}`;
      }
      const maxCrypto = TRADE_LIMITS.MAX_CRYPTO[fromCurrency as keyof typeof TRADE_LIMITS.MAX_CRYPTO];
      if (numValue > maxCrypto) {
        return `Maximum amount is ${formatCryptoAmount(maxCrypto)} ${fromCurrency}`;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchQuidaxId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('quidax_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        if (!profiles || profiles.length === 0) {
          setError('No profile found');
          return;
        }
        
        setQuidaxId(profiles[0]?.quidax_id || '');
      } catch (err) {
        console.error('Error fetching Quidax ID:', err);
        setError('Failed to fetch user profile');
      }
    };

    fetchQuidaxId();
  }, [supabase]);

  const fetchFeeConfig = async () => {
    try {
      // Check authentication before fetching fees
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access instant swap features.",
          variant: "destructive"
        });
        onClose();
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/config/fees');
      if (!response.ok) {
        throw new Error('Failed to fetch fee configuration');
      }
      const data = await response.json();
      setFeeConfig(data.data);
    } catch (error) {
      console.error('Error fetching fee config:', error);
      toast({
        title: "Error",
        description: "Failed to load fee configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeeConfig();
    }
  }, [isOpen]);

  const calculateFees = (amount: number) => {
    // Get volume tier based on NGN amount
    let feeTier = VOLUME_TIERS.TIER_1;
    for (const tier of Object.values(VOLUME_TIERS)) {
      if (amount >= tier.min && amount < tier.max) {
        feeTier = tier;
        break;
      }
    }

    // Calculate total fee based on volume tier
    const totalFee = (amount * feeTier.fee) / 100;
    
    return {
      platform: totalFee, // The entire fee is the platform fee
      service: 0, // No separate service fee
      total: totalFee
    };
  };

  const handleGetQuote = async () => {
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
      setIsLoading(true);
      setError(null);

      // Get current wallet balance
      const currentBalance = wallets.find(w => w.currency.toUpperCase() === fromCurrency.toUpperCase());
      const walletBalance = currentBalance ? parseFloat(currentBalance.balance) : 0;

      // Convert input amount to crypto based on selected currency type
      let cryptoAmount = parseFloat(amount);
      
      if (amountCurrency === 'NGN') {
        // For NGN input, first get NGN/USDT rate
        const ngnUsdtRate = await getMarketRate('USDT', 'NGN');
        if (!ngnUsdtRate) throw new Error('Unable to determine NGN/USDT rate');
        
        // Convert NGN to USDT first
        const usdtAmount = cryptoAmount / ngnUsdtRate;
        
        if (fromCurrency === 'USDT') {
          cryptoAmount = usdtAmount;
        } else {
          // Then convert USDT to target crypto
          const cryptoUsdtRate = await getMarketRate('USDT', fromCurrency);
          if (!cryptoUsdtRate) throw new Error('Unable to determine conversion rate');
          cryptoAmount = usdtAmount * cryptoUsdtRate;
        }
      } else if (amountCurrency === 'USD') {
        // For USD input, treat it same as USDT
        if (fromCurrency === 'USDT') {
          cryptoAmount = parseFloat(amount);
        } else {
          const cryptoUsdtRate = await getMarketRate('USDT', fromCurrency);
          if (!cryptoUsdtRate) throw new Error('Unable to determine conversion rate');
          cryptoAmount = parseFloat(amount) * cryptoUsdtRate;
        }
      }

      // Check if user has sufficient balance
      if (cryptoAmount > walletBalance) {
        throw new Error(`Insufficient ${fromCurrency} balance. Available: ${formatCryptoAmount(walletBalance)} ${fromCurrency}`);
      }

      // Get USDT equivalent for fee calculation
      let usdtAmount = cryptoAmount;
      if (fromCurrency !== 'USDT') {
        const usdtRate = await getMarketRate(fromCurrency, 'USDT');
        if (!usdtRate) throw new Error('Unable to determine USDT rate');
        usdtAmount = cryptoAmount * usdtRate;
      }

      // Get NGN/USDT rate for NGN equivalent calculation
      const ngnUsdtRate = await getMarketRate('USDT', 'NGN');
      if (!ngnUsdtRate) throw new Error('Unable to determine NGN/USDT rate');

      // Calculate NGN equivalent
      const ngnAmount = usdtAmount * ngnUsdtRate;

      // Get quote from API using the converted crypto amount
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          from_amount: cryptoAmount.toString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get quote');
      }

      const data = await response.json();
      
      // Calculate USD amount for fee tier (1 USDT = 1 USD)
      const usdAmount = usdtAmount;
      
      // Determine fee tier based on USD volume
      let feeTier = VOLUME_TIERS.TIER_1;
      for (const tier of Object.values(VOLUME_TIERS)) {
        if (usdAmount >= tier.min && usdAmount < tier.max) {
          feeTier = tier;
          break;
        }
      }

      // Calculate fees based on tier
      const fees = (ngnAmount * feeTier.fee) / 100;

      setTradeDetails({
        type: 'swap',
        amount: cryptoAmount.toString(),
        currency: fromCurrency,
        rate: ngnUsdtRate,
        fees: {
          total: fees,
          platform: fees,
          service: 0
        },
        total: ngnAmount + fees,
        quote_amount: data.to_receive,
        ngn_equivalent: ngnAmount,
        quotation_id: data.id
      });

      setShowPreview(true);
      startCountdown();
    } catch (error) {
      console.error('Error getting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setError(errorMessage);
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-500/90 text-white border-red-600",
      });
      
      // Reset form state
      resetForm();
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
    // Reset all form state
    setQuote(null);
    setAmount('');
    setCountdown(14);
    setShowPreview(false);
    setTradeDetails(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleConfirmSwap = async () => {
    if (!tradeDetails?.quotation_id) return;

    try {
      setIsConfirming(true);
      setError(null);

      const response = await fetch('/api/swap/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: tradeDetails.quotation_id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm swap');
      }

      const confirmation = await response.json();

      toast({
        title: "✅ Swap Successful",
        description: `Successfully swapped ${tradeDetails.amount} ${tradeDetails.currency} to ${confirmation.received_amount} ${confirmation.to_currency}`,
        variant: "default",
        className: "bg-green-500/90 text-white border-green-600",
      });

      // Close modals and refresh balances
      setShowPreview(false);
      onClose();
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm swap';
      setError(errorMessage);
      toast({
        title: "❌ Swap Failed",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-500/90 text-white border-red-600",
      });
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

  // Add useEffect to fetch market rates
  useEffect(() => {
    const fetchMarketRates = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/markets/rate', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch market rates');
        }

        const data = await response.json();
        if (!data || !data.rates) {
          throw new Error('Invalid rate data received');
        }

        setMarketRates(data.rates);
      } catch (error) {
        console.error('Error fetching market rates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch market rates",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      fetchMarketRates();
    }
  }, [isOpen, toast, supabase]);

  const startCountdown = () => {
    setCountdown(14);
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-950 via-orange-900 to-black border-orange-800/50">
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
                <SelectTrigger className="w-full h-12 bg-black/90 text-white border-orange-800/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-orange-800/50">
                  {wallets.map((wallet) => (
                    <SelectItem 
                      key={wallet.currency} 
                      value={wallet.currency}
                      className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{wallet.currency}</span>
                        <span className="text-white/70">
                          {getCurrencyName(wallet.currency)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderAvailableBalance()}
            </div>

            {/* Amount Section */}
            <div className="space-y-2">
              <Label className="text-white">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pr-24 h-12 bg-black/90 text-white border-orange-800/50"
                  placeholder={`Enter amount in ${amountCurrency === 'CRYPTO' ? fromCurrency : amountCurrency}`}
                />
                <Select
                  value={amountCurrency}
                  onValueChange={handleAmountCurrencyChange}
                >
                  <SelectTrigger className="absolute right-0 top-0 h-full w-24 border-l bg-black/90 text-white border-orange-800/50">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-orange-800/50">
                    {fromCurrency && (
                      <SelectItem 
                        value="CRYPTO"
                        className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                      >
                        {fromCurrency}
                      </SelectItem>
                    )}
                    <SelectItem 
                      value="NGN"
                      className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                    >
                      NGN
                    </SelectItem>
                    <SelectItem 
                      value="USD"
                      className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                    >
                      USD
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* To Section */}
            <div className="space-y-2">
              <Label className="text-white">To</Label>
              <Select
                value={toCurrency}
                onValueChange={setToCurrency}
              >
                <SelectTrigger className="w-full h-12 bg-black/90 text-white border-orange-800/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-orange-800/50">
                  <div className="sticky top-0 z-10 bg-black/90 p-2 border-b border-orange-800/50">
                    <Input
                      type="text"
                      placeholder="Search currencies..."
                      value={toSearchQuery}
                      onChange={(e) => setToSearchQuery(e.target.value)}
                      className="h-9 bg-black/90 text-white border-orange-800/50"
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
                          className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{currency.value}</span>
                            <span className="text-white/70">
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
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
      </Dialog>

      {tradeDetails && (
        <TradePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmSwap}
          trade={tradeDetails}
          countdown={countdown}
          toCurrency={toCurrency}
          setAmount={setAmount}
          setError={setError}
          setShowPreview={setShowPreview}
        />
      )}
    </>
  );
} 