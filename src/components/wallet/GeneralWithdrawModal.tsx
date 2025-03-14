'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { WithdrawPreview } from './WithdrawPreview';

const SUPPORTED_CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'BTC', label: 'Bitcoin (BTC)' },
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'USDC', label: 'USD Coin (USDC)' }
];

const NETWORKS_BY_CURRENCY: Record<string, Array<{
  id: string;
  name: string;
  isRecommended?: boolean;
  fee?: string;
}>> = {
  btc: [{ id: 'bitcoin', name: 'Bitcoin Network' }],
  eth: [{ id: 'ethereum', name: 'ERC20' }],
  usdt: [
    { id: 'tron', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'ethereum', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bsc', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'ethereum', name: 'ERC20' },
    { id: 'bsc', name: 'BEP20 (BSC)' }
  ]
};

export function GeneralWithdrawModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableBalance, setAvailableBalance] = useState('0');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (selectedCurrency) {
      fetchBalance();
    }
  }, [isOpen, selectedCurrency]);

  const resetForm = () => {
    setSelectedCurrency('');
    setSelectedNetwork('');
    setAmount('');
    setAddress('');
    setShowPreview(false);
    setError(null);
    setAvailableBalance('0');
  };

  const fetchBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();

      const wallet = data.wallets.find(
        (w: any) => w.currency.toLowerCase() === selectedCurrency.toLowerCase()
      );
      setAvailableBalance(wallet?.balance || '0');
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!selectedCurrency || !amount || !address) {
        throw new Error('Please fill in all required fields');
      }

      if (parseFloat(amount) > parseFloat(availableBalance)) {
        throw new Error('Insufficient balance');
      }

      if (selectedCurrency !== 'NGN' && !selectedNetwork) {
        throw new Error('Please select a network');
      }

      // Show preview
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount,
          address,
          network: selectedNetwork,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process withdrawal');
      }

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const networks = selectedCurrency ? 
    NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Select currency and enter withdrawal details
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCurrency && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Amount</Label>
                    <span className="text-sm text-muted-foreground">
                      Available: {availableBalance} {selectedCurrency}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                {selectedCurrency !== 'NGN' && (
                  <div className="space-y-2">
                    <Label>Select Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map((network) => (
                          <SelectItem 
                            key={network.id} 
                            value={network.id}
                          >
                            {network.name}
                            {network.fee && ` (Fee: ~${network.fee})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    {selectedCurrency === 'NGN' ? 'Bank Account Number' : 'Withdrawal Address'}
                  </Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      selectedCurrency === 'NGN' 
                        ? "Enter bank account number" 
                        : "Enter withdrawal address"
                    }
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Icons.warning className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !selectedCurrency || !amount || !address}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <WithdrawPreview
            amount={amount}
            currency={selectedCurrency}
            address={address}
            onConfirm={handleConfirmWithdraw}
            onCancel={() => setShowPreview(false)}
            loading={loading}
            expiryTime={Date.now() + 14000}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 