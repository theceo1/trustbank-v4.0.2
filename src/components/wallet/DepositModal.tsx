//src/components/wallet/DepositModal.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DepositPreview from './DepositPreview';
import { VirtualAccountModal } from './VirtualAccountModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"
import { QRCodeSVG } from 'qrcode.react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: {
    id: string;
    currency: string;
    balance: string;
  } | null;
}

// Helper: returns true if currency is fiat/NGN
const isFiatCurrency = (currency: string) => {
  return currency?.toLowerCase() === 'ngn';
}

// Networks available for each currency
const NETWORKS_BY_CURRENCY: Record<string, Array<{
  id: string;
  name: string;
  isRecommended?: boolean;
  fee?: string;
  isFiat?: boolean;
}>> = {
  btc: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  eth: [
    { id: 'erc20', name: 'Ethereum Network (ERC20)', isRecommended: true },
    { id: 'ethereum', name: 'Ethereum Network', fee: '10-20 USDT' }
  ],
  usdt: [
    { id: 'trc20', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'erc20', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'erc20', name: 'ERC20', isRecommended: true },
    { id: 'bep20', name: 'BEP20 (BSC)' }
  ],
  bnb: [{ id: 'bep20', name: 'BEP20 (BSC)', isRecommended: true }],
  matic: [{ id: 'polygon', name: 'Polygon Network', isRecommended: true }],
  sol: [{ id: 'solana', name: 'Solana Network', isRecommended: true }],
  dot: [{ id: 'polkadot', name: 'Polkadot Network', isRecommended: true }],
  ada: [{ id: 'cardano', name: 'Cardano Network', isRecommended: true }],
  xrp: [{ id: 'ripple', name: 'XRP Network', isRecommended: true }],
  doge: [{ id: 'dogecoin', name: 'Dogecoin Network', isRecommended: true }],
  link: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  aave: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  uni: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  cake: [{ id: 'bep20', name: 'BEP20 (BSC)', isRecommended: true }],
  shib: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  xlm: [{ id: 'stellar', name: 'Stellar Network', isRecommended: true }],
  fil: [{ id: 'filecoin', name: 'Filecoin Network', isRecommended: true }],
  axs: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  one: [{ id: 'harmony', name: 'Harmony Network', isRecommended: true }],
  xtz: [{ id: 'tezos', name: 'Tezos Network', isRecommended: true }],
  slp: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  sushi: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  zil: [{ id: 'zilliqa', name: 'Zilliqa Network', isRecommended: true }],
  floki: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mana: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  sand: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  ape: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  enj: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  lrc: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  cfx: [{ id: 'conflux', name: 'Conflux Network', isRecommended: true }],
  wld: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  pepe: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  meme: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  bonk: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  sui: [{ id: 'sui', name: 'Sui Network', isRecommended: true }],
  ordi: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  ens: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  algo: [{ id: 'algorand', name: 'Algorand Network', isRecommended: true }],
  arb: [{ id: 'arbitrum', name: 'Arbitrum Network', isRecommended: true }],
  wif: [{ id: 'btc', name: 'Bitcoin Network', isRecommended: true }],
  myro: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  nos: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  jup: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  blur: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  kata: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  coq: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  wassie: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  fet: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  near: [{ id: 'near', name: 'NEAR Protocol', isRecommended: true }],
  ai: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  bob: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  slerf: [{ id: 'sol', name: 'Solana Network', isRecommended: true }],
  bome: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  stx: [{ id: 'stacks', name: 'Stacks Network', isRecommended: true }],
  ton: [{ id: 'ton', name: 'TON Network', isRecommended: true }],
  rndr: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mog: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  inj: [{ id: 'injective', name: 'Injective Network', isRecommended: true }],
  mnt: [{ id: 'mantle', name: 'Mantle Network', isRecommended: true }],
  beam: [{ id: 'beam', name: 'Beam Network', isRecommended: true }],
  strk: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  nochill: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  mew: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  gno: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  waves: [{ id: 'waves', name: 'Waves Network', isRecommended: true }],
  xyo: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  trump: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  fartcoin: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  pnut: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  hype: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  ngn: [{ id: 'bank', name: 'Bank Transfer', isRecommended: true }],
  usd: [{ id: 'bank', name: 'Bank Transfer', isRecommended: true }]
};

// Add this helper function
const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'Binance Coin',
    MATIC: 'Polygon',
    SOL: 'Solana',
    DOT: 'Polkadot',
    ADA: 'Cardano',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    LINK: 'Chainlink',
    AAVE: 'Aave',
    UNI: 'Uniswap',
    CAKE: 'PancakeSwap',
    SHIB: 'Shiba Inu',
    XLM: 'Stellar',
    FIL: 'Filecoin',
    AXS: 'Axie Infinity',
    ONE: 'Harmony',
    XTZ: 'Tezos',
    SLP: 'Smooth Love Potion',
    SUSHI: 'SushiSwap',
    ZIL: 'Zilliqa',
    FLOKI: 'Floki Inu',
    MANA: 'Decentraland',
    SAND: 'The Sandbox',
    APE: 'ApeCoin',
    ENJ: 'Enjin Coin',
    LRC: 'Loopring',
    CFX: 'Conflux',
    WLD: 'Worldcoin',
    PEPE: 'Pepe',
    MEME: 'Memecoin',
    BONK: 'Bonk',
    SUI: 'Sui',
    ORDI: 'Ordinals',
    ENS: 'Ethereum Name Service',
    ALGO: 'Algorand',
    ARB: 'Arbitrum',
    WIF: 'Dogwifhat',
    MYRO: 'Myro',
    NOS: 'Nosana',
    JUP: 'Jupiter',
    BLUR: 'Blur',
    KATA: 'Katana Inu',
    COQ: 'Coq Inu',
    WASSIE: 'Wassie',
    FET: 'Fetch.ai',
    NEAR: 'NEAR Protocol',
    AI: 'Artificial Intelligence',
    BOB: 'BOB',
    SLERF: 'Slerf',
    BOME: 'BOME',
    STX: 'Stacks',
    TON: 'Toncoin',
    RNDR: 'Render',
    MOG: 'Mogcoin',
    INJ: 'Injective',
    MNT: 'Mantle',
    BEAM: 'Beam',
    STRK: 'Strike',
    NOCHILL: 'No Chill',
    MEW: 'MEW',
    GNO: 'Gnosis',
    WAVES: 'Waves',
    XYO: 'XYO Network',
    TRUMP: 'Trump',
    FARTCOIN: 'Fartcoin',
    PNUT: 'Peanut',
    HYPE: 'Hype'
  };
  return names[currency.toUpperCase()] || currency.toUpperCase();
};

const DepositModal = ({ isOpen, onClose, wallet }: DepositModalProps) => {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // State
  const [amount, setAmount] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [fees, setFees] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // [LOG] Fetch user info on modal open
  useEffect(() => {
    if (!isOpen) return;
    setUserLoaded(false);
    setLoading(true);
    setError("");
    (async () => {
      try {
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error(userError?.message || "User not found");
        }
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'trustBank User');
        setUserEmail(user.email || 'user@trustbank.com');
        setUserLoaded(true);
        setLoading(false);
        // Removed success toast for user loaded
        
      } catch (err: any) {
        setError("Failed to load user info.");
        setLoading(false);
        setUserLoaded(false);
        toast({
          title: "User Error",
          description: err.message || "Could not load user info.",
          className: "bg-red-600 text-white"
        });
        console.error("[DepositModal] User load error:", err);
      }
    })();
  }, [isOpen, supabase, toast]);

  // [LOG] Amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^\d.]/g, ""));
    setError("");
    
  };

  // [LOG] Proceed to preview
  const handleContinue = async () => {
    console.log('[DepositModal] handleContinue called', { amount, userLoaded });
    if (!userLoaded) {
      setError("User info not loaded.");
      toast({
        title: "User Error",
        description: "User info not loaded.",
        className: "bg-red-600 text-white"
      });
      return;
    }
    const maxAmount = 1000000;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid deposit amount');
      toast({
        title: "Invalid Amount",
        description: "Enter a valid deposit amount.",
        className: "bg-red-600 text-white"
      });
      return;
    }
    if (Number(amount) > maxAmount) {
      setError(`Maximum deposit per transaction is ₦${maxAmount.toLocaleString()}`);
      toast({
        title: "Deposit Limit",
        description: `Maximum deposit per transaction is ₦${maxAmount.toLocaleString()}. Please enter a lower amount.`,
        className: "bg-yellow-500 text-white"
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Fetch a Korapay fee quote (simulate bank transfer, do not finalize)
      let korapay_fee = 0;
      let vat = 0;
      try {
        const korapayQuoteRes = await fetch('/api/payments/korapay/bank-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(amount),
            account_name: userName || 'trustBank User',
            customer: { name: userName || 'trustBank User', email: userEmail || 'user@trustbank.com' },
            preview: true // Add a preview flag so backend does NOT finalize or create a real account
          })
        });
        const korapayQuoteData = await korapayQuoteRes.json();
        if (korapayQuoteRes.ok && korapayQuoteData.fee !== undefined && korapayQuoteData.vat !== undefined) {
          korapay_fee = korapayQuoteData.fee;
          vat = korapayQuoteData.vat;
        } else if (korapayQuoteRes.ok && korapayQuoteData.data && korapayQuoteData.data.fee !== undefined && korapayQuoteData.data.vat !== undefined) {
          korapay_fee = korapayQuoteData.data.fee;
          vat = korapayQuoteData.data.vat;
        }
      } catch (e) {
        // fallback to 0 if quote fails
        korapay_fee = 0;
        vat = 0;
      }
      // 2. Fetch fees breakdown from backend, passing korapay_fee and vat for accurate preview
      const res = await fetch('/api/config/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: wallet?.currency || 'ngn',
          type: 'deposit',
          korapay_fee,
          vat
        })
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.data) {
        throw new Error(data.error || "Failed to fetch fee breakdown");
      }
      setFees(data.data);
      setShowPreview(true);
      setError("");
      console.log('[DepositModal] showPreview set to true, fees:', data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch fee breakdown");
      setShowPreview(false);
    } finally {
      setLoading(false);
      console.log('[DepositModal] handleContinue finished', { showPreview });
    }
  };



  // [LOG] Confirm deposit and fetch virtual account
  const handleConfirm = async () => {
    // Only allow NGN fiat deposits
    if (wallet?.currency && wallet.currency.toUpperCase() !== 'NGN') {
      toast({
        title: 'Coming Soon',
        description: 'Deposits in USD and GBP will be available soon.',
        className: 'bg-yellow-500 text-white'
      });
      return;
    }
    console.log('[DepositModal] handleConfirm called', { amount, userName, userEmail });
    setLoading(true);
    setError("");
    setShowPreview(false);
    try {
      const res = await fetch('/api/payments/korapay/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          account_name: userName || 'trustBank User',
          customer: { name: userName || 'trustBank User', email: userEmail || 'user@trustbank.com' }
        })
      });
      const data = await res.json();
      console.log('[DepositModal] Virtual account API response', data);
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to fetch virtual account");
      }
      // Use backend's fee breakdown for confirmation/final step
      if (data.data) setFees(data.data);
      setVirtualAccount(data.data || data);
      console.log('[DepositModal] setVirtualAccount', data.data || data);
      // Do NOT record transaction here. Wait until user clicks Done.
    } catch (err: any) {
      setError(err.message || "Failed to fetch virtual account");
      console.error('[DepositModal] handleConfirm error', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: choose which fee breakdown to show (preview or authoritative)
  const getFeeDisplay = () => {
    // If virtualAccount is present, use backend authoritative fees
    if (virtualAccount && fees && fees.total_fee) {
      return fees;
    }
    // Otherwise, use preview
    return fees;
  };


  const resetModal = () => {
    setVirtualAccount(null);
    setAmount("");
    setFees(null);
    setShowPreview(false);
    setError("");
  };

  const handleDone = async () => {
    // Record transaction only when user clicks Done
    if (virtualAccount) {
      const korapayReference = (virtualAccount.bank_account && virtualAccount.bank_account.reference) || virtualAccount.reference || '';
      const requestBody = {
        type: 'DEPOSIT', // UPPERCASE to match API schema
        amount: Number(amount),
        description: `NGN Deposit via Korapay (ref: ${korapayReference})`,
        reference: korapayReference,
        currency: 'NGN'
      };
      try {
        console.log('[DepositModal] handleDone POST body:', requestBody);
        const txRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const responseText = await txRes.text();
        console.log('[DepositModal] handleDone response status:', txRes.status);
        console.log('[DepositModal] handleDone response text:', responseText);
        if (txRes.status === 404) {
          toast({
            title: 'Transaction Recording Error',
            description: 'Transaction recording endpoint not found. Please contact support.',
            className: 'bg-yellow-500 text-white'
          });
        } else if (!txRes.ok) {
          toast({
            title: 'Transaction Error',
            description: `Failed to record transaction: ${responseText}`,
            className: 'bg-red-600 text-white'
          });
          throw new Error('Failed to record transaction.');
        } else {
          toast({
            title: 'Deposit Successful',
            description: 'Your deposit was successful and has been recorded.',
            className: 'bg-green-600 text-white'
          });
        }
      } catch (txErr: any) {
        toast({
          title: 'Deposit Recorded (Partial)',
          description: 'Deposit succeeded but failed to record transaction. Please contact support.',
          className: 'bg-yellow-500 text-white'
        });
        console.error('[DepositModal] Failed to record transaction:', txErr);
      }
    }
    resetModal();
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogTitle className="sr-only">Deposit</DialogTitle>
        <DialogDescription className="sr-only">Deposit funds into your trustBank account. Please review the fee breakdown and confirm your deposit.</DialogDescription>
        <div className="p-0 bg-gradient-to-br from-[#2d014d] via-[#17002d] to-[#0d001a] rounded-2xl shadow-2xl border-2 border-purple-900" aria-describedby="deposit-modal-desc">
          <DialogTitle id="deposit-modal-title" className="text-white text-2xl font-bold text-center mb-6">Deposit Funds</DialogTitle>
          <DialogDescription id="deposit-modal-desc" className="text-purple-200 text-center mb-8">
            Deposit NGN into your trustBank wallet. Enter the amount and follow the steps to fund your wallet instantly.
          </DialogDescription>

          {/* 1. Deposit amount input */}
          {!showPreview && !virtualAccount && (
            <div className="flex flex-col gap-6 px-8 py-8 rounded-2xl">
              <div className="mb-2">
                <Label htmlFor="deposit-amount" className="text-purple-200 mb-1 block text-lg font-semibold">Amount</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  className="bg-purple-900 text-white border-2 border-purple-500 focus:border-white focus:ring-2 focus:ring-purple-300 placeholder-purple-400 text-xl px-4 py-3 rounded-lg shadow-inner"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  min={1}
                  aria-label="Deposit amount"
                />
                <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-yellow-300 dark:text-yellow-200">
                  <Icons.info className="w-4 h-4 text-yellow-400 dark:text-yellow-300" />
                  <span>Maximum deposit per transaction is <b>₦1,000,000</b>. This increases based on your transaction volume.</span>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button variant="outline" onClick={onClose} className="flex-1 border-white text-white hover:bg-purple-800 bg-transparent font-semibold py-3 text-lg rounded-lg">Close</Button>
                <Button
                  variant="default"
                  className="flex-1 bg-white text-purple-800 font-extrabold hover:bg-purple-200 py-3 text-lg rounded-lg shadow"
                  onClick={handleContinue}
                  disabled={loading}
                  aria-label="Proceed to trade details"
                >
                  {loading ? 'Processing...' : 'Proceed'}
                </Button>
              </div>
            </div>
          )}

          {/* 2. Deposit preview or loading spinner */}
          {showPreview && !virtualAccount && (
            (!fees || !amount || Number(amount) === 0) ? (
              <div className="w-full max-w-[95vw] sm:max-w-[340px] mx-auto p-3 sm:p-5 rounded-xl shadow-xl border border-gray-200 bg-white dark:bg-[#18132a] flex flex-col items-center justify-center min-h-[180px]">
                <DialogTitle id="deposit-loading-title" className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Deposit Funds</DialogTitle>
                <DialogDescription id="deposit-loading-desc" className="mb-4 text-gray-500 text-sm text-center">Deposit NGN into your trustBank wallet. Enter the amount and follow the steps to fund your wallet instantly.</DialogDescription>
                <svg className="animate-spin h-9 w-9 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">Loading fee breakdown…</span>
              </div>
            ) : (
              <DepositPreview
                amount={Number(amount) || 0}
                currency={wallet?.currency || 'ngn'}
                depositAmount={Number(amount) || 0}
                userName={userName}
                serviceFee={Number(getFeeDisplay().service_fee) || 0}
                vat={Number(getFeeDisplay().vat) || 0}
                totalFee={Number(getFeeDisplay().total_fee) || 0}
                youWillReceive={Number(getFeeDisplay().you_receive) || ((Number(amount) || 0) - (Number(getFeeDisplay().total_fee) || 0))}
                loading={loading}
                error={error}
                onCancel={() => setShowPreview(false)}
                onConfirm={handleConfirm}
                descriptionId="deposit-preview-desc"
              />
            )
          )}

          {/* 3. Virtual account details */}
          {virtualAccount && (
            <VirtualAccountModal
              open={!!virtualAccount}
              onDone={handleDone}
              accountName={virtualAccount.bank_account?.account_name || virtualAccount.account_name}
              accountNumber={virtualAccount.bank_account?.account_number || virtualAccount.account_number}
              bankName={virtualAccount.bank_account?.bank_name || virtualAccount.bank_name}
              amount={virtualAccount.amount}
              loading={loading} userName={''}            />
          )}

          {/* 4. Error message */}
          {!virtualAccount && error && (
            <div className="text-red-600 py-4 text-center font-semibold">{error}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
// --- Transaction History Display (for wiring in main wallet/dashboard UI) ---
// import { useEffect, useState } from 'react';
// import TransactionHistory from './TransactionHistory';
//
// const [transactions, setTransactions] = useState<any[]>([]);
// useEffect(() => {
//   fetch('/api/transactions')
//     .then(res => res.json())
//     .then(setTransactions);
// }, []);
//
// <TransactionHistory transactions={transactions} />
//
// Place this block in your wallet or dashboard page (NOT inside DepositModal) to show all user transactions (deposits, withdrawals, swaps, transfers, etc.)

export default DepositModal;