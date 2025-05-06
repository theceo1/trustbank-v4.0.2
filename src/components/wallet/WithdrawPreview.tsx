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
  showCurrencyIcon?: boolean;
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
  showCurrencyIcon = true,
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

  // (Removed static NETWORK_FEES, now using Quidax API for crypto fees)

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
      return; // Guard: never fetch network fee for NGN
    }
    async function fetchNetworkFee() {
      setNetworkFeeLoading(true);
      setNetworkFeeError(null);
      try {
        // Fetch withdrawal fee from Quidax API
        const res = await fetch(`https://www.quidax.com/api/v1/fee?currency=${currency.toLowerCase()}`);
        if (!res.ok) throw new Error('Failed to fetch network fee');
        const data = await res.json();
        // Quidax returns an array of fee ranges
        // Find the correct fee for the withdrawal amount
        const feeRanges = data?.data?.fee;
        let fee = 0;
        if (Array.isArray(feeRanges) && typeof amountInCrypto === 'number') {
          const found = feeRanges.find((range: any) => amountInCrypto >= range.min && amountInCrypto < range.max);
          fee = found ? found.value : 0;
        }
        setNetworkFee(typeof fee === 'number' ? fee : 0);
      } catch (err: any) {
        setNetworkFeeError(err.message || 'Error fetching network fee');
        setNetworkFee(0);
      } finally {
        setNetworkFeeLoading(false);
      }
    }
    fetchNetworkFee();
  }, [currency, amountInCrypto]);

  useEffect(() => {
    async function fetchPlatformFee() {
      setFeeLoading(true);
      setFeeError(null);
      try {
        const res = await fetch('/api/config/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), currency }),
        });
        if (!res.ok) throw new Error('Failed to fetch platform fee');
        const data = await res.json();
        // Expecting response: { fee, currency, display? }
        setPlatformFee(typeof data.fee === 'number' ? data.fee : 0);
      } catch (err: any) {
        setFeeError(err.message || 'Error fetching platform fee');
        setPlatformFee(0);
      } finally {
        setFeeLoading(false);
      }
    }
    if (amount && currency) fetchPlatformFee();
  }, [amount, currency]);

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
          {/* Single Progress/Status Row reflecting withdrawal status */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  status === 'completed'
                    ? 'bg-green-500 w-full'
                    : status === 'processing'
                    ? 'bg-yellow-400 w-2/3'
                    : status === 'initiated'
                    ? 'bg-blue-500 w-1/3'
                    : 'bg-gray-300 w-0'
                }`}
              />
            </div>
            <span className="text-xs font-semibold">
              {status === 'completed' && 'Completed'}
              {status === 'processing' && 'Processing'}
              {status === 'initiated' && 'Initiated'}
            </span>
          </div>
          {/* End Progress/Status Row */}
          {currency.toLowerCase() === 'ngn' ? (
  <div>
    {/* Amount to Withdraw */}
    <div className="space-y-2">
      <Label>Amount to Withdraw</Label>
      <div className="font-mono">
        {/* Only show symbol, never code */}
        ₦{formatCurrency(parseFloat(amount), 'NGN')}
      </div>
    </div>
    {/* Withdrawal Fee */}
    <div className="space-y-2">
      <Label>Withdrawal Fee</Label>
      <div className="font-mono">
        {ngnFeeLoading || feeLoading ? (
          <span>Loading...</span>
        ) : ngnFeeError || feeError ? (
          <span className="text-red-500">{ngnFeeError || feeError}</span>
        ) : (
          <span>
            ₦{formatCurrency(Math.max(typeof ngnFee === 'number' ? ngnFee : platformFee ?? 0, 200), 'NGN')}
          </span>
        )}
      </div>
    </div>
    {/* You Will Receive */}
    <div className="space-y-2">
      <Label>You Will Receive</Label>
      <div className="font-mono font-bold">
        {ngnFeeLoading || feeLoading ? (
          <span>Loading...</span>
        ) : ngnFeeError || feeError ? (
          <span className="text-red-500">{ngnFeeError || feeError}</span>
        ) : (
          <span>
            ₦{formatCurrency(
              Math.max(
                0,
                parseFloat(amount) - Math.max(typeof ngnFee === 'number' ? ngnFee : platformFee ?? 0, 200)
              ),
              'NGN'
            )}
          </span>
        )}
      </div>
    </div>
    {/* Transaction Details - always show, fallback to '-' if missing */}
    {/* Transaction Details - show bank name, but not code */}
    <div className="space-y-2">
      <Label>Account Number</Label>
      <div className="font-mono">{accountNumber || '-'}</div>
    </div>
    <div className="space-y-2">
      <Label>Bank Name</Label>
      <div className="font-mono">{typeof bankName === 'string' && isNaN(Number(bankName)) ? bankName : '-'}
      </div>
    </div>
    <div className="space-y-2">
      <Label>Account Name</Label>
      <div className="font-mono">{accountName || '-'}</div>
    </div>
  </div>
          ) : (
            <div>
              <div className="space-y-2">
                <Label>Amount to Withdraw</Label>
                <div className="font-mono text-lg">
                  {(() => {
                    const symbols: Record<string, string> = { btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                    const sym = showCurrencyIcon ? (symbols[currency.toLowerCase()] || '') : '';
                    return `${sym}${amountInCrypto?.toFixed(8)}`;
                  })()}
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
                    (() => {
                      const symbols: Record<string, string> = { btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                      const sym = showCurrencyIcon ? (symbols[currency.toLowerCase()] || '') : '';
                      return <span>{sym}{networkFee?.toFixed(8)}</span>;
                    })()
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform Fee</Label>
                <div className="font-mono">
                  {(() => {
                    const symbols: Record<string, string> = { btc: '₿', eth: 'Ξ', usdt: '₮', usdc: '＄', bnb: '🟡' };
                    const sym = showCurrencyIcon ? (symbols[currency.toLowerCase()] || '') : '';
                    return `${sym}${platformFeeCrypto.toFixed(8)}`;
                  })()}
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
                    const sym = showCurrencyIcon ? (symbols[currency.toLowerCase()] || '') : '';
                    return `${sym}${finalAmount.toFixed(8)}`;
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