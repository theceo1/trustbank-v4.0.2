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
  const [amount, setAmount] = useState("");
  const [amountInCrypto, setAmountInCrypto] = useState(0);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(0);
  const [network, setNetwork] = useState<NetworkType | "">("");
  const [withdrawType, setWithdrawType] = useState<"crypto" | "ngn">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState(wallet.currency.toUpperCase());
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('CRYPTO');
  const [showPreview, setShowPreview] = useState(false);
  const [availableCryptos, setAvailableCryptos] = useState<string[]>([]);
  const [bankReference, setBankReference] = useState("");
  const [walletData, setWalletData] = useState<any>(null);
  const supabase = createClientComponentClient<Database>();
  
  // Bank withdrawal form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);

  const currency = selectedCrypto;

  // Get the current wallet's balance from walletData
  const getCurrentWallet = () => {
    if (!walletData) return null;
    return walletData.wallets.find((w: any) => w.currency.toUpperCase() === currency.toUpperCase());
  };

  const getMarketRate = () => {
    if (!walletData) return 0;
    const marketInfo = walletData.marketData.find((m: any) => 
      m.currency.toUpperCase() === currency.toUpperCase()
    );
    return marketInfo?.price || 0;
  };

  const balance = getCurrentWallet()?.balance ? parseFloat(getCurrentWallet().balance) : 0;
  const currentRate = getMarketRate();
  const balanceInNGN = balance * currentRate;

  // Fetch available cryptos and market data
  useEffect(() => {
    const fetchData = async () => {
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

        // Filter wallets with balance > 0
        const cryptosWithBalance = data.wallets
          .filter((w: any) => parseFloat(w.balance) > 0)
          .map((w: any) => w.currency.toUpperCase());

        // If no balances, show core currencies
        setAvailableCryptos(
          cryptosWithBalance.length > 0 
            ? cryptosWithBalance 
            : ['BTC', 'ETH', 'USDT', 'XRP']
        );

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
            setNetwork(networks[0]);
          } else if (currentCurrency === 'USDT') {
            setNetwork('TRC20'); // Default to TRC20 for USDT
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

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, currency, supabase]);

  // Update rate when currency changes
  useEffect(() => {
    if (walletData) {
      const marketInfo = walletData.marketData.find((m: any) => 
        m.currency.toUpperCase() === currency.toUpperCase()
      );
      setRate(marketInfo?.price || 0);
    }
  }, [currency, walletData]);

  const handleMaxAmount = () => {
    if (inputCurrency === 'CRYPTO') {
      setAmount(balance.toString());
      setAmountInCrypto(balance);
    } else if (inputCurrency === 'NGN') {
      setAmount(balanceInNGN.toString());
      setAmountInCrypto(balanceInNGN / rate);
    } else {
      const usdAmount = balanceInNGN / 1585.23; // Hardcoded USD rate for now
      setAmount(usdAmount.toString());
      setAmountInCrypto(usdAmount * 1585.23 / rate);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value || '0');
    
    if (inputCurrency === 'CRYPTO') {
      setAmountInCrypto(numValue);
    } else if (inputCurrency === 'NGN') {
      setAmountInCrypto(numValue / rate);
    } else {
      setAmountInCrypto((numValue * 1585.23) / rate); // Convert USD to NGN then to crypto
    }
  };

  const validateAccountNumber = async (accNumber: string) => {
    if (accNumber.length === 10 && bankName) {
      setIsValidatingAccount(true);
      try {
        const response = await fetch(`/api/bank/validate-account?bank=${bankName}&account=${accNumber}`);
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
    if (!amount || (!address && !accountNumber) || (!network && currency.toLowerCase() !== 'ngn' && withdrawType === 'crypto')) {
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
      if (withdrawType === 'crypto') {
        const withdrawal = await quidaxService.createWithdrawal(userId, {
          currency: currency.toLowerCase(),
          amount: amountInCrypto.toString(),
          address,
        });

        await supabase.from('transactions').insert({
          user_id: userId,
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount: amountInCrypto,
          currency: currency,
          status: 'pending',
          quidax_transaction_id: withdrawal.id,
        });
      } else {
        // Handle NGN withdrawal
        const response = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency,
            amount: amountInCrypto.toString(),
            withdrawType,
            bankDetails: { 
              bankName, 
              accountNumber, 
              accountName,
              reference: bankReference 
            }
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'NGN withdrawal failed');
        }
      }

      toast({
        title: "Success",
        description: "Withdrawal initiated successfully",
      });

      onClose();
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

  const renderCryptoWithdraw = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Cryptocurrency</label>
        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger>
            <SelectValue placeholder="Select cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            {availableCryptos.map((crypto) => (
              <SelectItem key={crypto} value={crypto}>
                {crypto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Amount</label>
          <Select value={inputCurrency} onValueChange={(value) => setInputCurrency(value as InputCurrency)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRYPTO">{currency}</SelectItem>
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
            placeholder={inputCurrency === 'NGN' ? '₦0.00' : inputCurrency === 'USD' ? '$0.00' : '0.00'}
            min="0"
            step="any"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
            onClick={handleMaxAmount}
          >
            MAX
          </Button>
        </div>
        <p className="text-sm text-green-600">
          {inputCurrency === 'CRYPTO' ? (
            `≈ ₦${formatCurrency(parseFloat(amount || '0') * rate, 'NGN')}`
          ) : inputCurrency === 'NGN' ? (
            `≈ ${formatCurrency(amountInCrypto, currency)}`
          ) : (
            `≈ ${formatCurrency(amountInCrypto, currency)} (₦${formatCurrency(parseFloat(amount || '0') * 1585.23, 'NGN')})`
          )}
        </p>
      </div>

      {networkConfig[currency as keyof NetworkConfig]?.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
          <Select value={network} onValueChange={(value) => setNetwork(value as NetworkType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {networkConfig[currency as keyof NetworkConfig]?.map((net) => (
                <SelectItem key={net} value={net}>
                  {net}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Withdrawal Address</label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={`Enter ${selectedCrypto} wallet address`}
        />
      </div>

      <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <Icons.warning className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
          Please ensure you have entered the correct withdrawal address and selected the appropriate network.
          Transactions cannot be reversed once processed.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderNGNWithdraw = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Cryptocurrency</label>
        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
          <SelectTrigger>
            <SelectValue placeholder="Select cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            {availableCryptos.map((crypto) => (
              <SelectItem key={crypto} value={crypto}>
                {crypto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amount (NGN)</label>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="₦0.00"
            min="0"
            step="any"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
            onClick={handleMaxAmount}
          >
            MAX
          </Button>
        </div>
        {rate > 0 && (
          <p className="text-sm text-green-600">
            ≈ {formatCurrency(amountInCrypto, selectedCrypto)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bank Name</label>
        <Select value={bankName} onValueChange={setBankName}>
          <SelectTrigger>
            <SelectValue placeholder="Select your bank" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_BANKS.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Account Number</label>
        <Input
          value={accountNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            setAccountNumber(value);
            validateAccountNumber(value);
          }}
          placeholder="Enter 10-digit account number"
          maxLength={10}
        />
      </div>

      {isValidatingAccount && (
        <div className="flex items-center justify-center py-2">
          <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Validating account...</span>
        </div>
      )}

      {accountName && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Account Name</label>
          <div className="rounded-md border bg-muted px-3 py-2">
            <p className="text-sm">{accountName}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Bank Reference (Optional)</label>
        <Input
          value={bankReference}
          onChange={(e) => setBankReference(e.target.value)}
          placeholder="Enter bank reference or narration"
        />
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Icons.info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-600 dark:text-blue-400">
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
        expiryTime={Date.now() + 14000} // 14 seconds from now
        rate={rate}
        amountInCrypto={amountInCrypto}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Withdraw</span>
            {isLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Available balance: {formatCurrency(balance, currency)}
              {currency !== 'NGN' && currentRate > 0 && (
                <span className="text-green-600">
                  {' '}(≈ ₦{formatCurrency(balanceInNGN, 'NGN')})</span>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        {currency.toLowerCase() === 'ngn' ? (
          renderNGNWithdraw()
        ) : (
          <Tabs defaultValue="crypto" className="w-full" onValueChange={(value) => setWithdrawType(value as "crypto" | "ngn")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crypto">Crypto Withdrawal</TabsTrigger>
              <TabsTrigger value="ngn">NGN Withdrawal</TabsTrigger>
            </TabsList>
            <TabsContent value="crypto" className="mt-4">
              {renderCryptoWithdraw()}
            </TabsContent>
            <TabsContent value="ngn" className="mt-4">
              {renderNGNWithdraw()}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !amount || (!address && !accountNumber) || (!network && currency.toLowerCase() !== 'ngn' && withdrawType === 'crypto')}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Withdraw'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 