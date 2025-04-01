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
import { QRCodeSVG } from 'qrcode.react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  eth: [{ id: 'erc20', name: 'ERC20' }],
  usdt: [
    { id: 'trc20', name: 'TRC20', isRecommended: true, fee: '1 USDT' },
    { id: 'erc20', name: 'ERC20', fee: '10-20 USDT' },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: '0.5-1 USDT' }
  ],
  usdc: [
    { id: 'erc20', name: 'ERC20' },
    { id: 'bep20', name: 'BEP20 (BSC)' }
  ]
};

export function GeneralDepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isOpen) {
      setSelectedCurrency('');
      setSelectedNetwork('');
      setShowAddress(false);
      setAddress(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchAddress = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(`/api/wallet/address?currency=${selectedCurrency.toLowerCase()}&network=${selectedNetwork}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch deposit address');
      }

      if (data.status === 'success' && data.data?.address) {
        setAddress(data.data.address);
        setShowAddress(true);
      } else {
        throw new Error('No deposit address found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch deposit address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const networks = selectedCurrency ? 
    NETWORKS_BY_CURRENCY[selectedCurrency.toLowerCase()] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-black via-green-950 to-black border-green-800/50">
        <DialogHeader>
          <DialogTitle className="text-white">Deposit Funds</DialogTitle>
          <DialogDescription className="text-white/70">
            Select currency and network to generate deposit address
          </DialogDescription>
        </DialogHeader>

        {!showAddress ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Select Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="bg-black/90 text-white border-green-800/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-green-800/50">
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem 
                      key={currency.value} 
                      value={currency.value}
                      className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                    >
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCurrency && selectedCurrency !== 'NGN' && networks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white">Select Network</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="bg-black/90 text-white border-green-800/50">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-800/50">
                    {networks.map((network) => (
                      <SelectItem 
                        key={network.id} 
                        value={network.id}
                        className="text-white hover:bg-green-600 hover:text-white data-[highlighted]:text-white data-[highlighted]:bg-green-600"
                      >
                        {network.name}
                        {network.fee && (
                          <span className="text-white/70 ml-2">
                            (Fee: ~{network.fee})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCurrency === 'NGN' ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-800/50 bg-black/90 p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Bank Name</span>
                      <span className="text-sm text-white">T.B.D</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Account Name</span>
                      <span className="text-sm text-green-400">trustBank Technologies</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Account Number</span>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-black/90 px-2 py-1 text-white">T.B.D</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy('T.B.D')}
                          className="text-green-400 hover:text-green-300"
                        >
                          {copied ? (
                            <Icons.check className="h-4 w-4" />
                          ) : (
                            <Icons.copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <Icons.info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Your deposit will be credited to your NGN wallet within 5-10 minutes after payment confirmation.
                    Please use your registered email as reference when making the transfer.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Button
                onClick={fetchAddress}
                disabled={!selectedCurrency || (!selectedNetwork && selectedCurrency !== 'NGN')}
                className="w-full"
              >
                Continue
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Icons.spinner className="h-8 w-8 animate-spin text-green-400" />
                <p className="text-sm text-white">
                  Generating deposit address...
                </p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="border-red-500/50 bg-red-950/50">
                <Icons.warning className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : address ? (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={address} size={200} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Deposit Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-black/90 p-2 font-mono text-sm break-all text-white border border-green-800/50">
                      {address}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(address)}
                      className="bg-black/90 text-green-400 hover:text-green-300 border-green-800/50"
                    >
                      {copied ? (
                        <Icons.check className="h-4 w-4" />
                      ) : (
                        <Icons.copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Alert className="bg-yellow-950/20 border-yellow-800/50">
                  <Icons.warning className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-100">
                    Only send {selectedCurrency} to this address on the {selectedNetwork.toUpperCase()} network.
                    Sending any other asset may result in permanent loss.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => setShowAddress(false)}
                  className="w-full bg-black/90 text-white border-green-800/50 hover:bg-green-600"
                >
                  Back
                </Button>
              </>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 