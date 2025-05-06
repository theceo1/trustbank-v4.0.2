"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { WithdrawPreview } from './WithdrawPreview';

interface Bank {
  code: string;
  name: string;
}

interface WithdrawModalProps {
  isOpen: boolean;
  wallet: any;
  onClose: () => void;
  userId: string;
}

// Volume-based fee tiers (USD)
const VOLUME_TIERS = [
  { min: 0, max: 1000, fee: 4.0 },
  { min: 1000, max: 5000, fee: 3.5 },
  { min: 5000, max: 20000, fee: 3.0 },
  { min: 20000, max: 100000, fee: 2.8 },
  { min: 100000, max: Infinity, fee: 2.5 },
];

// Example network fees (should be fetched from config ideally)
const NETWORK_FEES: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.005,
  USDT: 1,
};

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
  ada: [{ id: 'cardano', name: 'Cardano Network', isRecommended: true }],
  xrp: [{ id: 'ripple', name: 'XRP Network', isRecommended: true }],
  doge: [{ id: 'dogecoin', name: 'Dogecoin Network', isRecommended: true }],
  link: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  aave: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  uni: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  cake: [{ id: 'bep20', name: 'BEP20 (BSC)', isRecommended: true }],
  shib: [{ id: 'erc20', name: 'ERC20', isRecommended: true }],
  xlm: [{ id: 'stellar', name: 'Stellar Network', isRecommended: true }],
};


function getFeeTier(volumeUsd: number) {
  for (let i = 0; i < VOLUME_TIERS.length; i++) {
    const tier = VOLUME_TIERS[i];
    if (volumeUsd >= tier.min && volumeUsd < tier.max) {
      return { ...tier, name: `Tier ${i + 1}` };
    }
  }
  const last = VOLUME_TIERS[VOLUME_TIERS.length - 1];
  return { ...last, name: `Tier ${VOLUME_TIERS.length}` };
}

export function WithdrawModal({ isOpen, wallet, onClose, userId }: WithdrawModalProps) {
  // ...existing hooks...
  const [rateError, setRateError] = useState<string | null>(null);
  // =====================
  // ALL HOOKS MUST BE AT THE TOP! DO NOT ADD HOOKS BELOW THIS BLOCK OR AFTER THE EARLY RETURN.
  // =====================
  const { toast } = useToast();
  const { theme } = useTheme();
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State hooks
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawTab, setWithdrawTab] = useState<'crypto' | 'ngn'>(wallet?.currency?.toLowerCase() === 'ngn' ? 'ngn' : 'crypto');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  // Make selectedBankName available in component scope
  const selectedBankName = banks.find(b => b.code === selectedBank)?.name;

  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  // Withdrawal status: 'initiated' | 'processing' | 'completed'
  const [withdrawStatus, setWithdrawStatus] = useState<'initiated' | 'processing' | 'completed'>('initiated');
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [userVolumeUsd, setUserVolumeUsd] = useState(0); // User's 30-day volume in USD
  const [usdRate, setUsdRate] = useState(0); // USD/NGN rate

  // NGN withdrawal fee state
  const [ngnFee, setNgnFee] = useState<number | null>(null);
  const [ngnFeeLoading, setNgnFeeLoading] = useState(false);
  const [ngnFeeError, setNgnFeeError] = useState<string | null>(null);

  // Only show the relevant tab for the wallet type
  const isCryptoWallet = wallet?.currency?.toLowerCase() !== 'ngn';

  // Reset form state and tab when modal opens or wallet changes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setIsLoading(false);
      setWithdrawTab(wallet?.currency?.toLowerCase() === 'ngn' ? 'ngn' : 'crypto');
      setSelectedBank("");
      setAccountNumber("");
      setAccountName("");
      setBankSearch("");
      setDropdownOpen(false);
      setHighlightedIndex(0);
      setShowPreview(false);
      // Fetch NGN withdrawal fee if NGN wallet
      if (wallet?.currency?.toLowerCase() === 'ngn') {
        setNgnFeeLoading(true);
        setNgnFeeError(null);
        fetch('/api/config/fees')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch NGN withdrawal fee');
            return res.json();
          })
          .then(data => {
            // Try to get the ngn withdrawal fee from config
            const fee = data?.data?.base_fees?.ngn_withdrawal;
            setNgnFee(typeof fee === 'number' ? fee : 0);
          })
          .catch(err => {
            setNgnFeeError(err.message || 'Error fetching NGN withdrawal fee');
            setNgnFee(0);
          })
          .finally(() => setNgnFeeLoading(false));
      }
      // Auto-select recommended or first network for crypto withdrawals
      if (wallet?.currency && wallet?.currency?.toLowerCase() !== 'ngn') {
        const currencyKey = wallet.currency.toLowerCase();
        const networks = NETWORKS_BY_CURRENCY[currencyKey];
        if (networks && networks.length > 0) {
          const recommended = networks.find((n: any) => n.isRecommended) || networks[0];
          setSelectedNetwork(recommended.id);
        }
      }
    }
  }, [isOpen, wallet]);

  useEffect(() => {
    // No cleanup needed
    return undefined;
  }, [isOpen, wallet]);

  // Filtered banks for search
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!dropdownOpen) setHighlightedIndex(0);
  }, [dropdownOpen, bankSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Fetch banks when modal opens
  useEffect(() => {
    const fetchBanks = async () => {
      if (!isOpen) return;
      
      setIsLoadingBanks(true);
      try {
        const response = await fetch('/api/payments/dojah/banks');
        const data = await response.json();
        if (Array.isArray(data.entity)) {
          setBanks(data.entity);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch banks. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [isOpen, toast]);

  // Validate account number when it changes
  useEffect(() => {
    const validateAccount = async () => {
      if (accountNumber.length === 10 && selectedBank) {
        setIsValidatingAccount(true);
        try {
          const response = await fetch('/api/payments/dojah/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bankCode: selectedBank,
              accountNumber: accountNumber 
            }),
          });
          const data = await response.json();
          if (data.status && data.data?.account_name) {
            setAccountName(data.data.account_name);
          } else {
            setAccountName('');
            toast({
              title: "Error",
              description: data.error || "Could not verify account number",
              variant: "destructive"
            });
          }
        } catch (error) {
          setAccountName('');
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

    validateAccount();
  }, [accountNumber, selectedBank, toast]);

  // Fetch user's 30-day trading volume (USD) and USD/NGN rate
  useEffect(() => {
    async function fetchUserVolumeAndRate() {
      if (!isOpen) return;
      try {
        // Fetch user profile for trading volume
        const res = await fetch(`/api/user/volume?userId=${userId}`);
        const data = await res.json();
        setUserVolumeUsd(data.volume_usd || 0);
      } catch (e) {
        setUserVolumeUsd(0);
      }
      try {
        // Fetch USD/NGN rate
        const res = await fetch('/api/markets/usdtngn/ticker');
        if (!res.ok) throw new Error('Failed to fetch USD/NGN rate');
        const data = await res.json();
        if (!data || !data.data || isNaN(parseFloat(data.data.price))) {
          setUsdRate(0);
          setRateError('Could not fetch USD/NGN rate. Some conversions may be unavailable.');
        } else {
          setUsdRate(parseFloat(data.data.price));
          setRateError(null);
        }
      } catch (e) {
        setUsdRate(0);
        setRateError('Could not fetch USD/NGN rate. Some conversions may be unavailable.');
      }
    }
    fetchUserVolumeAndRate();
  }, [isOpen, userId]);

  // =====================
  // END HOOKS BLOCK
  // =====================

  // Early return if modal is not open (DO NOT ADD HOOKS AFTER THIS)
  if (!isOpen) {
    return null;
  }

  // Fee calculation helpers
  function getCryptoFee(amount: number, currency: string) {
    // Convert crypto to USD using USD/NGN rate if available
    // For simplicity, assume 1 USDT = 1 USD, and for BTC/ETH, use market rate if available
    let usdAmount = amount;
    if (currency.toUpperCase() === 'NGN') {
      usdAmount = amount / usdRate;
    } else if (currency.toUpperCase() !== 'USDT') {
      // For BTC/ETH, fetch their USD rate (not implemented here, assume 1:1 for demo)
      // In production, fetch the real rate
    }
    const tier = getFeeTier(userVolumeUsd);
    const fee = (usdAmount * tier.fee) / 100;
    return { fee, feePercent: tier.fee };
  }

  const handleSubmit = async () => {
    try {
      // Reset status to initiated each time preview is shown
      setWithdrawStatus('initiated');
      // Basic validation
      if (!amount) {
        toast({
          title: "Error",
          description: "Please enter an amount",
          variant: "destructive"
        });
        return;
      }
      if (isCryptoWallet) {
        if (!selectedNetwork) {
          toast({
            title: "Error",
            description: "Please select a network",
            variant: "destructive"
          });
          return;
        }
        if (!destinationAddress) {
          toast({
            title: "Error",
            description: "Please enter a destination address",
            variant: "destructive"
          });
          return;
        }
      } else {
        if (!selectedBank || !accountNumber) {
          toast({
            title: "Error",
            description: "Please fill in all required fields",
            variant: "destructive"
          });
          return;
        }
      }
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare withdrawal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmWithdrawal = async () => {
    try {
      setWithdrawStatus('processing');
      setIsLoading(true);
      // Here you would make the actual withdrawal API call
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWithdrawStatus('completed');
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });
      // Wait a bit to show completed state before closing
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setWithdrawStatus('initiated');
      toast({
        title: "Error",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const renderPreview = () => {
    const selectedBankName = banks.find(b => b.code === selectedBank)?.name;
    const amt = parseFloat(amount) || 0;
    let fee = 0, feePercent = 0, networkFee = 0, total = 0, tierName = '';
    if (isCryptoWallet) {
      const feeObj = getCryptoFee(amt, wallet?.currency);
      const tier = getFeeTier(userVolumeUsd);
      fee = feeObj.fee;
      feePercent = tier.fee;
      tierName = tier.name;
      networkFee = NETWORK_FEES[wallet?.currency?.toUpperCase()] || 0;
      total = amt - fee - networkFee;
    } else {
      const tier = getFeeTier(userVolumeUsd);
      fee = ngnFee ?? 0;
      feePercent = tier.fee;
      tierName = tier.name;
      total = amt - fee;
    }
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Confirm Withdrawal</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <span>Fee Tier:</span>
              <span>{tierName} ({feePercent}%)</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icons.info className="w-3 h-3 text-blue-400 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  Your fee tier is based on your 30-day USD trading volume. Higher volume = lower fees.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Amount:</span>
              <span className="text-white">{amount} {wallet?.currency?.toUpperCase()}</span>
            </div>
            {isCryptoWallet ? (
              <>
                <div className="flex justify-between text-white/70">
                  <span>Network:</span>
                  <span className="text-white">{selectedNetwork}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Destination Address:</span>
                  <span className="text-white break-all">{destinationAddress}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span className="flex items-center gap-1">Fee ({feePercent}%):
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icons.info className="w-3 h-3 text-blue-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        This is the platform fee based on your trading volume tier.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-white">{fee.toFixed(8)} {wallet?.currency?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span className="flex items-center gap-1">Network Fee:
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icons.info className="w-3 h-3 text-blue-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        This is the blockchain network fee for processing your withdrawal.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-white">{networkFee} {wallet?.currency?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-white/70 font-bold">
                  <span>Total to Receive:</span>
                  <span className="text-white">{total.toFixed(8)} {wallet?.currency?.toUpperCase()}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-white/70">
                  <span>Bank:</span>
                  <span className="text-white">{selectedBankName}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Account Number:</span>
                  <span className="text-white">{accountNumber}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Account Name:</span>
                  <span className="text-white">{accountName}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span className="flex items-center gap-1">Fee:
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icons.info className="w-3 h-3 text-blue-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        This is the flat fee for NGN withdrawals.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-white">₦{fee}</span>
                </div>
                <div className="flex justify-between text-white/70 font-bold">
                  <span>Total to Receive:</span>
                  <span className="text-white">₦{total}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(false)}
            variant="outline"
            className="flex-1 bg-black text-white border-green-800/50 hover:bg-green-600/20"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirmWithdrawal}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <>
      {isCryptoWallet ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount in ${wallet?.currency?.toUpperCase()}`}
              className="bg-black text-white border-green-800/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Network</label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="bg-black text-white border-green-800/50">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-800/50">
                <SelectItem value="btc" className="text-white">Bitcoin Network</SelectItem>
                <SelectItem value="eth" className="text-white">ERC20</SelectItem>
                <SelectItem value="trx" className="text-white">TRC20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Destination Address</label>
            <Input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="Enter destination address"
              className="bg-black text-white border-green-800/50"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </div>
      ) : (
        <>
          <Tabs value={withdrawTab} onValueChange={v => setWithdrawTab(v as 'crypto' | 'ngn')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20">
              <TabsTrigger value="ngn" className="text-white data-[state=active]:bg-green-600">NGN</TabsTrigger>
            </TabsList>
            <TabsContent value="ngn" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Amount (NGN)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in NGN"
                  className="bg-black text-white border-green-800/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Bank</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`w-full h-10 text-sm bg-black text-white border border-green-800/50 rounded-md px-3 flex items-center justify-between focus:outline-none ${dropdownOpen ? 'ring-2 ring-green-600' : ''}`}
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {banks.find(b => b.code === selectedBank)?.name || "Select a bank"}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-black border border-green-800/50 rounded-md shadow-lg">
                      <div className="sticky top-0 bg-black border-b border-green-800/30 p-2">
                        <Input
                          type="text"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Search bank..."
                          className="bg-black text-white border-green-800/50 h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredBanks.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">No banks found</div>
                        ) : (
                          filteredBanks.map((bank, idx) => (
                            <button
                              key={bank.code}
                              className={`w-full px-3 py-2 text-sm text-left ${
                                idx === highlightedIndex ? 'bg-green-600 text-white' : 'text-white hover:bg-green-600/20'
                              } transition-colors`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onClick={() => {
                                setSelectedBank(bank.code);
                                setDropdownOpen(false);
                                setAccountName("");
                                setAccountNumber("");
                              }}
                            >
                              {bank.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Account Number</label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter account number"
                  maxLength={10}
                  className="bg-black text-white border-green-800/50"
                />
                {isValidatingAccount && (
                  <p className="text-sm text-blue-400">Verifying account...</p>
                )}
                {accountName && !isValidatingAccount && (
                  <p className="text-sm text-green-400">Account Name: {accountName}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </>
      )}
      <Alert className="bg-blue-900/20 border-blue-800/50">
        <Icons.info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-sm text-blue-100">
          Bank transfers are typically processed within 3-7 minutes after confirmation.
          Please ensure your bank account details are correct before proceeding.
        </AlertDescription>
      </Alert>
    </>
  );

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-indigo-950 via-purple-900 to-black border-purple-800/50">
          <DialogHeader>
            <DialogTitle className="text-white">Withdraw {wallet?.currency?.toUpperCase()}</DialogTitle>
            <DialogDescription className="text-white/70">
              {isCryptoWallet ? 'Withdraw to an external crypto address' : 'Enter your bank details to withdraw'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rateError && (
              <div className="bg-yellow-800 text-yellow-200 rounded px-3 py-2 mb-2 text-sm">
                {rateError}
              </div>
            )}
            {showPreview ? (
              <WithdrawPreview
                amount={amount}
                currency={wallet?.currency}
                address={isCryptoWallet ? destinationAddress : `${selectedBank} / ${accountNumber} / ${accountName}`}
                onConfirm={handleConfirmWithdrawal}
                onCancel={() => setShowPreview(false)}
                loading={isLoading}
                expiryTime={Date.now() + 14000}
                rate={wallet?.ngnRate}
                usdRate={usdRate}
                amountInCrypto={isCryptoWallet ? parseFloat(amount) : undefined}
                ngnFee={ngnFee}
                ngnFeeLoading={ngnFeeLoading}
                ngnFeeError={ngnFeeError}
                bankName={selectedBankName || '-'}
                accountNumber={accountNumber || '-'}
                accountName={accountName || '-'}
                status={withdrawStatus}
                showCurrencyIcon={isCryptoWallet ? false : true}
              />
            ) : renderForm()}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}