'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

export interface WithdrawPreviewProps {
  amount: string;
  currency: string;
  address: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  expiryTime: number;
  rate?: number;
  usdRate: number;
  amountInCrypto?: number;
  ngnFee?: number | null;
  ngnFeeLoading?: boolean;
  ngnFeeError?: string | null;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  status?: 'initiated' | 'processing' | 'completed';
}

export function WithdrawPreview({
  amount,
  currency,
  address,
  onConfirm,
  onCancel,
  loading,
  expiryTime,
  rate,
  usdRate,
  amountInCrypto,
  ngnFee,
  ngnFeeLoading,
  ngnFeeError,
  bankName,
  accountNumber,
  accountName,
  status = 'initiated',
}: WithdrawPreviewProps) {
  const [timeLeft, setTimeLeft] = useState(14);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch platform fee dynamically from /api/config/fees
  const [platformFee, setPlatformFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Fetch network fee dynamically from /api/fees/network?currency={currency}
  const [networkFee, setNetworkFee] = useState<number | null>(null);
  const [networkFeeLoading, setNetworkFeeLoading] = useState(true);
  const [networkFeeError, setNetworkFeeError] = useState<string | null>(null);

  // Fallback static network fee map (same as WithdrawModal)
  const NETWORK_FEES: Record<string, number> = {
    btc: 0.0001,
    eth: 0.005,
    usdt: 1,
    usdc: 1,
    bnb: 0.001
  };

  // Platform fee calculation for crypto: use percentage tier (default to 0.5%)
  function getCryptoPlatformFee(amount: number): number {
    // You may want to pass userVolume or tier as a prop for more accuracy
    const tier = 0.005; // 0.5% default
    return amount * tier;
  }

  const platformFeeCrypto = currency.toLowerCase() !== 'ngn' ? getCryptoPlatformFee(amountInCrypto ?? 0) : 0;

  const totalFees = (networkFee ?? 0) + platformFeeCrypto;
  const finalAmount = amountInCrypto ? Math.max(0, amountInCrypto - totalFees) : parseFloat(amount);

  useEffect(() => {
    // Only fetch network fee for crypto currencies, not NGN/fiat
    if (currency.toLowerCase() === 'ngn') {
      setNetworkFee(0);
      setNetworkFeeLoading(false);
      setNetworkFeeError(null);
      return;
    }
    async function fetchNetworkFee() {
      setNetworkFeeLoading(true);
      setNetworkFeeError(null);
      try {
        const res = await fetch(`/api/fees/network?currency=${currency}`);
        if (!res.ok) throw new Error('Failed to fetch network fee');
        const data = await res.json();
        // Assume API returns { fee: number }
        const fee = data?.fee;
        setNetworkFee(typeof fee === 'number' ? fee : 0);
      } catch (err: any) {
        setNetworkFeeError(err.message || 'Error fetching network fee');
        setNetworkFee(0);
      } finally {
        setNetworkFeeLoading(false);
      }
    }
    fetchNetworkFee();
  }, [currency]);

  useEffect(() => {
    async function fetchPlatformFee() {
      setFeeLoading(true);
      setFeeError(null);
      try {
        const res = await fetch('/api/config/fees');
        if (!res.ok) throw new Error('Failed to fetch platform fee');
        const data = await res.json();
        const fee = data?.data?.base_fees?.platform;
        setPlatformFee(typeof fee === 'number' ? fee : 0);
      } catch (err: any) {
        setFeeError(err.message || 'Error fetching platform fee');
        setPlatformFee(0);
      } finally {
        setFeeLoading(false);
      }
    }
    fetchPlatformFee();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((expiryTime - now) / 1000));
      setTimeLeft(secondsLeft);
      
      if (secondsLeft === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Progress 
          value={(timeLeft / 14) * 100} 
          className="h-2 bg-secondary"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Initiated</span>
          <span>Processing</span>
          <span>Completed</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirm Withdrawal</CardTitle>
          <CardDescription>
            {currency.toLowerCase() === 'ngn'
              ? 'Withdraw to your bank account'
              : 'Withdraw to an external crypto address'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Dynamic Progress Bar */}
<div className="flex justify-between text-sm text-muted-foreground mb-2">
  {['initiated', 'processing', 'completed'].map((step, idx) => (
    <span
      key={step}
      className={
        status === step
          ? 'font-bold text-green-400'
          : idx < ['initiated', 'processing', 'completed'].indexOf(status)
          ? 'text-green-600'
          : ''
      }
    >
      {step.charAt(0).toUpperCase() + step.slice(1)}
    </span>
  ))}
</div>

{currency.toLowerCase() === 'ngn' ? (
  <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount to Withdraw</Label>
                <div className="font-mono">
                  {(() => {
                    const symbols: Record<string, string> = { ngn: '₦', usd: '$', btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                    const sym = symbols[currency.toLowerCase()] || currency.toUpperCase();
                    return `${sym}${formatCurrency(parseFloat(amount), currency.toUpperCase())}`;
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Withdrawal Fee</Label>
                <div className="font-mono">
                  {ngnFeeLoading || feeLoading ? (
                    <span>Loading...</span>
                  ) : ngnFeeError || feeError ? (
                    <span className="text-red-500">{ngnFeeError || feeError}</span>
                  ) : (
                    (() => {
                      const symbols: Record<string, string> = { ngn: '₦', usd: '$', btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                      const sym = symbols[currency.toLowerCase()] || currency.toUpperCase();
                      // Use ngnFee if available, else fallback to platformFee
                      const feeToShow = typeof ngnFee === 'number' ? ngnFee : platformFee ?? 0;
                      return <span>{sym}{formatCurrency(feeToShow, currency.toUpperCase())}</span>;
                    })()
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>You Will Receive</Label>
                <div className="font-mono text-lg font-bold">
                  {ngnFeeLoading || feeLoading ? (
                    <span>Loading...</span>
                  ) : ngnFeeError || feeError ? (
                    <span className="text-red-500">-</span>
                  ) : (
                    (() => {
                      const symbols: Record<string, string> = { ngn: '₦', usd: '$', btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                      const sym = symbols[currency.toLowerCase()] || currency.toUpperCase();
                      const feeToShow = typeof ngnFee === 'number' ? ngnFee : platformFee ?? 0;
                      return <span>{sym}{formatCurrency(Math.max(0, parseFloat(amount) - feeToShow), currency.toUpperCase())}</span>;
                    })()
                  )}
                </div>
              </div>
              {/* Transaction Details */}
              {bankName && (
                <div className="space-y-2">
                  <Label>Destination Bank</Label>
                  <div className="font-mono">{bankName}</div>
                </div>
              )}
              {accountNumber && (
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <div className="font-mono">{accountNumber}</div>
                </div>
              )}
              {accountName && (
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <div className="font-mono">{accountName}</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="space-y-2">
                <Label>Amount to Withdraw</Label>
                <div className="font-mono text-lg">
                  {amountInCrypto?.toFixed(8)} {currency.toUpperCase()}
                  <div className="text-sm text-muted-foreground">
                    ≈ ₦{formatCurrency((amountInCrypto ?? 0) * (rate || 0), 'NGN')} / ${formatCurrency((amountInCrypto ?? 0) * ((rate || 0) / (usdRate || 1)), 'USD')}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Network Fee</Label>
                <div className="font-mono">
                  {networkFeeLoading ? (
                    <span>Loading...</span>
                  ) : networkFeeError ? (
                    <span className="text-red-500">{networkFeeError}</span>
                  ) : (
                    <span>{networkFee?.toFixed(8)} {currency.toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform Fee</Label>
                <div className="font-mono">
                  {platformFeeCrypto.toFixed(8)} {currency.toUpperCase()}
                  <div className="text-sm text-muted-foreground">
                    ≈ ₦{formatCurrency(platformFeeCrypto * (rate || 0), 'NGN')} / ${formatCurrency(platformFeeCrypto * ((rate || 0) / (usdRate || 1)), 'USD')}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>You Will Receive</Label>
                <div className="font-mono text-lg font-bold">
                  {(() => {
                    const symbols: Record<string, string> = { btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡', ngn: '₦' };
                    const sym = symbols[currency.toLowerCase()] || currency.toUpperCase();
                    return `${finalAmount.toFixed(8)} ${sym}`;
                  })()}
                  <div className="text-sm text-muted-foreground font-normal">
                    ≈ ₦{formatCurrency(finalAmount * (rate || 0), 'NGN')} / ${formatCurrency(finalAmount * ((rate || 0) / (usdRate || 1)), 'USD')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={onCancel}
            disabled={loading || isExpired}
            className="bg-gray-600 hover:bg-gray-700 text-white transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || isExpired}
            className="bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}