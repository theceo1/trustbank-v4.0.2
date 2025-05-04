'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { quidaxService } from "@/lib/quidax";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { WithdrawPreview } from './WithdrawPreview';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BankSelector } from '@/components/payments/BankSelector';
import { BankAccountVerifier } from '@/components/payments/BankAccountVerifier';
import { useTheme } from 'next-themes';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    id: string;
    currency: string;
    balance: string;
    converted_balance?: string;
  };
  userId: string;
}

type NetworkType = 'Bitcoin Network' | 'ERC20' | 'TRC20' | 'BEP20' | 'Polygon Network';

const CORE_CURRENCIES = ['NGN', 'BTC', 'ETH', 'USDT', 'USDC'];

type NetworkConfig = {
  [key in 'BTC' | 'ETH' | 'USDT' | 'BNB' | 'MATIC']: NetworkType[];
};

const networkConfig: NetworkConfig = {
  BTC: ['Bitcoin Network'],
  ETH: ['ERC20'],
  USDT: ['ERC20', 'TRC20', 'BEP20'],
  BNB: ['BEP20'],
  MATIC: ['Polygon Network']
};

// List of supported banks
const SUPPORTED_BANKS = [
  { id: 'providus', name: 'Providus Bank' },
  { id: 'kuda', name: 'Kuda Bank' },
  { id: 'gtb', name: 'Guaranty Trust Bank' },
  { id: 'first', name: 'First Bank' },
  { id: 'zenith', name: 'Zenith Bank' },
  { id: 'access', name: 'Access Bank' },
  { id: 'uba', name: 'United Bank for Africa' },
  { id: 'stanbic', name: 'Stanbic IBTC Bank' },
  { id: 'sterling', name: 'Sterling Bank' },
  { id: 'union', name: 'Union Bank' }
].sort((a, b) => a.name.localeCompare(b.name));

type InputCurrency = 'CRYPTO' | 'NGN' | 'USD';

export function WithdrawModal({ isOpen, wallet, onClose, userId }: WithdrawModalProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  
  // All state hooks at the top
  const [amount, setAmount] = useState("");
  const [amountInCrypto, setAmountInCrypto] = useState(0);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('CRYPTO');
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [expiryTime] = useState(Date.now() + 14000);
  const [walletData, setWalletData] = useState<any>(null);
  const [currency, setCurrency] = useState(wallet?.currency?.toUpperCase() || 'NGN');
  const [reference, setReference] = useState("");
  const [network, setNetwork] = useState<NetworkType | ''>('');
  const [currentRate, setCurrentRate] = useState(0);
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawalType, setWithdrawalType] = useState<'crypto' | 'fiat'>('crypto');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [withdrawTab, setWithdrawTab] = useState<'crypto' | 'ngn'>('ngn');

  // Ensure we have valid currency codes
  const balance = parseFloat(wallet?.balance || '0');
  const balanceInNGN = currentRate > 0 ? balance * currentRate : 0;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setNetwork("");
      setAddress("");
      setCurrentRate(0);
      setIsConfirming(false);
      setAccountNumber("");
      setAccountName("");
      setBankCode("");
      setBankName("");
    }
  }, [isOpen]);

  // Effect to fetch market rate
  useEffect(() => {
    const fetchRate = async () => {
      if (wallet?.currency && isOpen) {
        const newRate = await getMarketRate();
        if (newRate) setRate(newRate);
      }
    };
    fetchRate();
  }, [wallet?.currency, isOpen]);

  // Effect to update selected network
  useEffect(() => {
    if (wallet?.currency) {
      setSelectedNetwork(wallet.currency.toUpperCase());
    }
  }, [wallet?.currency]);

  // Effect to fetch wallet data
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No session found');
        }

        const response = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch wallet data');
        const data = await response.json();
        
        setWalletData(data);

        // Set market rate
        const marketInfo = data.marketData.find((m: any) => 
          m.currency.toLowerCase() === currency.toLowerCase()
        );
        
        if (marketInfo) {
          setRate(marketInfo.price);
        }

        // Auto-select network based on currency
        const currentCurrency = currency.toUpperCase();
        if (currentCurrency in networkConfig) {
          const networks = networkConfig[currentCurrency as keyof NetworkConfig];
          if (networks?.length === 1) {
            setSelectedNetwork(networks[0]);
          } else if (currentCurrency === 'USDT') {
            setSelectedNetwork('TRC20');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet data. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, [isOpen, currency, supabase, toast]);

  // Auto-verify account when both bank and 10-digit account number are filled
  useEffect(() => {
    const verify = async () => {
      if (selectedBank && accountNumber.length === 10) {
        setIsVerifying(true);
        setVerifyError(null);
        setAccountName('');
        try {
          const res = await fetch('/api/payments/korapay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bankCode: selectedBank,
              accountNumber: accountNumber.replace(/\D/g, '') // Ensure only digits
            }),
          });
          const data = await res.json();
          
          if (!res.ok) {
            console.error('Account verification failed:', data);
            setVerifyError(data.error || 'Could not verify account');
            setAccountName('');
            return;
          }

          if (data.status === 'success' && data.data.account_name) {
            setAccountName(data.data.account_name);
            setVerifyError(null);
          } else {
            setVerifyError('Could not verify account');
            setAccountName('');
          }
        } catch (e) {
          console.error('Account verification error:', e);
          setVerifyError('Could not verify account');
          setAccountName('');
        } finally {
          setIsVerifying(false);
        }
      } else {
        setAccountName('');
        setVerifyError(null);
      }
    };
    verify();
  }, [selectedBank, accountNumber]);

  // Early return if modal is not open
  if (!isOpen) {
    return null;
  }

  // Get the current wallet's balance from walletData
  const getCurrentWallet = () => {
    if (!walletData) return null;
    return walletData.wallets.find((w: any) => w.currency.toUpperCase() === currency.toUpperCase());
  };

  // Get market rate for the selected currency
  const getMarketRate = async () => {
    try {
      if (!wallet?.currency) return 0;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const response = await fetch(`/api/markets/rate?from=${wallet.currency}&to=NGN`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      return data.rate || 0;
    } catch (error) {
      console.error('Error fetching market rate:', error);
      return 0;
    }
  };

  const handleMaxAmount = () => {
    if (inputCurrency === 'CRYPTO') {
      setAmount(balance.toString());
      setAmountInCrypto(balance);
    } else if (inputCurrency === 'NGN') {
      setAmount(balanceInNGN.toString());
      setAmountInCrypto(balanceInNGN / (rate || 1));
    } else {
      const usdAmount = balanceInNGN / 1585.23; // Hardcoded USD rate for now
      setAmount(usdAmount.toString());
      setAmountInCrypto(usdAmount * 1585.23 / (rate || 1));
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
    if (rate > 0) {
      setAmountInCrypto(Number(numericValue) / rate);
    }
  };

  const validateAccountNumber = async (accNumber: string) => {
    if (accNumber.length === 10 && selectedBank) {
      setIsValidatingAccount(true);
      try {
        const response = await fetch(`/api/bank/validate-account?bank=${selectedBank}&account=${accNumber}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.account_name) {
          setAccountName(data.data.account_name);
        } else {
          setAccountName('');
          toast({
            title: "Error",
            description: "Could not verify account number",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error validating account:', error);
        toast({
          title: "Error",
          description: "Failed to validate account number",
          variant: "destructive"
        });
      } finally {
        setIsValidatingAccount(false);
      }
    } else {
      setAccountName('');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || (!address && !accountNumber) || (!selectedNetwork && currency.toLowerCase() !== 'ngn')) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmWithdraw = async () => {
    setIsLoading(true);
    try {
      if (currency.toLowerCase() === 'ngn') {
        // Handle NGN withdrawal using Korapay
        const response = await fetch('/api/payments/korapay/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInCrypto.toString(),
            currency: 'NGN',
            bankCode: selectedBank,
            accountNumber,
            accountName,
            narration: `Withdrawal to ${accountName}`
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'NGN withdrawal failed');
        }

        const data = await response.json();
        if (data.status === 'success') {
          toast({
            title: "Success",
            description: "Withdrawal initiated successfully. Please wait for confirmation.",
          });
          onClose();
        } else {
          throw new Error(data.message || 'Withdrawal failed');
        }
      } else {
        // Handle crypto withdrawal
        const response = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency: currency.toLowerCase(),
            amount: amountInCrypto.toString(),
            address,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Withdrawal failed');
        }

        toast({
          title: "Success",
          description: "Withdrawal initiated successfully",
        });

        onClose();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (withdrawTab === 'ngn') {
      if (!amount || Number(amount) < 1000 || Number(amount) > 10000000) {
        toast({
          title: 'Error',
          description: 'You can only transfer an amount between NGN 1000 and NGN 10000000',
          variant: 'destructive',
        });
        return;
      }
      if (!selectedBank || !accountNumber || !accountName) {
        toast({
          title: 'Error',
          description: 'Please fill in all bank details',
          variant: 'destructive',
        });
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/payments/korapay/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(amount),
            currency: 'NGN',
            bankCode: selectedBank,
            accountNumber,
            accountName,
            narration: reference || `Withdrawal from TrustBank`,
          }),
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'success') {
          throw new Error(data.error || data.message || 'Failed to process transfer');
        }
        toast({
          title: 'Success',
          description: 'Transfer initiated successfully',
          variant: 'default',
        });
        setTimeout(onClose, 1200);
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Crypto withdrawal logic (existing)
      // ...
    }
  };

  const renderCryptoWithdraw = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Select Currency</label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="bg-black text-white border-green-800/50 h-8 text-xs">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-black border-green-800/50">
            {walletData?.wallets
              .filter((w: any) => parseFloat(w.balance) > 0 || CORE_CURRENCIES.includes(w.currency.toUpperCase()))
              .map((w: any) => (
                <SelectItem key={w.currency} value={w.currency.toUpperCase()} className="text-white text-xs">
                  {w.currency.toUpperCase()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {currency && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-white">Network</label>
          <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as NetworkType)}>
            <SelectTrigger className="bg-black text-white border-green-800/50 h-8 text-xs">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-800/50">
              {networkConfig[currency as keyof NetworkConfig]?.map((net) => (
                <SelectItem key={net} value={net} className="text-white text-xs">
                  {net}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white">Amount</label>
          <Select value={inputCurrency} onValueChange={(value) => setInputCurrency(value as InputCurrency)}>
            <SelectTrigger className="w-[90px] bg-black text-white border-green-800/50 h-8 text-xs">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-800/50">
              <SelectItem value="CRYPTO" className="text-white text-xs">{currency}</SelectItem>
              <SelectItem value="NGN" className="text-white text-xs">NGN</SelectItem>
              <SelectItem value="USD" className="text-white text-xs">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder={inputCurrency === 'NGN' ? '₦0.00' : inputCurrency === 'USD' ? '$0.00' : '0.00'}
            min="0"
            step="any"
            className="bg-black text-white border-green-800/50 h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-green-400 h-6 px-2"
            onClick={handleMaxAmount}
          >
            MAX
          </Button>
        </div>
        <p className="text-[10px] text-green-400">
          {inputCurrency === 'CRYPTO' ? (
            `≈ ₦${formatCurrency(parseFloat(amount || '0') * rate, 'NGN')}`
          ) : inputCurrency === 'NGN' ? (
            `≈ ${amountInCrypto.toFixed(8)} ${currency}`
          ) : (
            `≈ ${amountInCrypto.toFixed(8)} ${currency} (₦${formatCurrency(parseFloat(amount || '0') * 1585.23, 'NGN')})`
          )}
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Withdrawal Address</label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={`Enter ${selectedNetwork} wallet address`}
          className="bg-black text-white border-green-800/50 h-8 text-xs"
        />
      </div>

      <Alert className="bg-yellow-900/20 border-yellow-800/50 py-2">
        <Icons.warning className="h-3 w-3 text-yellow-400" />
        <AlertDescription className="text-[10px] text-yellow-100">
          Please ensure you have entered the correct withdrawal address and selected the appropriate network.
          Transactions cannot be reversed once processed.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderNGNWithdraw = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Amount (NGN)</label>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="₦0.00"
            min="0"
            step="any"
            className="bg-black text-white border-green-800/50 h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-green-400 h-6 px-2"
            onClick={handleMaxAmount}
          >
            MAX
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Bank Name</label>
        <BankSelector
          value={selectedBank}
          onSelect={setSelectedBank}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Account Number</label>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="Enter 10-digit account number"
          maxLength={10}
          className="bg-black text-white border-green-800/50 h-8 text-xs"
        />
      </div>
      {isVerifying && (
        <div className="text-xs text-blue-400">Verifying account...</div>
      )}
      {accountName && !isVerifying && !verifyError && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-white">Account Name</label>
          <div className="rounded-md border border-green-800/50 bg-black/50 px-3 py-1.5">
            <p className="text-xs text-green-600 font-bold">{accountName}</p>
          </div>
        </div>
      )}
      {verifyError && (
        <div className="text-xs text-red-500">{verifyError}</div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium text-white">Reference (Optional)</label>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Add a reference for this withdrawal"
          className="bg-black text-white border-green-800/50 h-8 text-xs"
        />
      </div>
      <Alert className="bg-blue-900/20 border-blue-800/50 py-2">
        <Icons.info className="h-3 w-3 text-blue-400" />
        <AlertDescription className="text-[10px] text-blue-100">
          Bank transfers are typically processed within 3-7 minutes after confirmation.
          Please ensure your bank account details are correct before proceeding.
        </AlertDescription>
      </Alert>
    </div>
  );

  if (showPreview) {
    return (
      <WithdrawPreview
        amount={amount}
        currency={currency}
        address={address}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setShowPreview(false)}
        loading={isLoading}
        expiryTime={expiryTime}
        rate={rate}
        amountInCrypto={amountInCrypto}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-900 to-black border-purple-800/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-base font-semibold text-white">
              Withdraw {wallet?.currency?.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              {withdrawTab === 'ngn' ? 'Enter your bank details to withdraw' : 'Select a network and enter withdrawal details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Tabs value={withdrawTab} onValueChange={v => setWithdrawTab(v as 'crypto' | 'ngn')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 h-8">
                <TabsTrigger value="crypto" className="text-xs text-white data-[state=active]:bg-green-600">Crypto Withdrawal</TabsTrigger>
                <TabsTrigger value="ngn" className="text-xs text-white data-[state=active]:bg-green-600">NGN Withdrawal</TabsTrigger>
              </TabsList>
              <TabsContent value="crypto" className="mt-3">
                {renderCryptoWithdraw()}
              </TabsContent>
              <TabsContent value="ngn" className="mt-3">
                {renderNGNWithdraw()}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9"
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </DialogFooter>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 