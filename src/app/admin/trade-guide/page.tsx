'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function TradeGuidePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Trade Guide</h1>
      <p className="text-muted-foreground">
        This guide explains how trading works on trustBank and how revenue is generated.
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Quidax charges a 1.4% fee for handling payment and wallet services. This fee is applied to all transactions.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <h3 className="font-semibold">Fee Breakdown</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>1.4% - Quidax fee for payment and wallet services</li>
                <li>All revenue from this fee goes to Quidax</li>
                <li>The fee is calculated based on the transaction amount</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">1. User Registration</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Users must complete KYC verification</li>
                <li>Required documents: Valid ID, Proof of address</li>
                <li>Verification usually takes 24-48 hours</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Wallet Funding</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Bank transfers in NGN</li>
                <li>Cryptocurrency deposits</li>
                <li>Instant funding via payment providers</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">3. Trading</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Market orders - instant execution at current price</li>
                <li>Limit orders - execution at specified price</li>
                <li>Supported pairs: BTC/NGN, ETH/NGN, USDT/NGN</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">4. Fee Structure</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Trading fee: 1.4% per trade</li>
                <li>Withdrawal fees vary by currency</li>
                <li>No deposit fees</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">5. Settlement</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Trades are settled instantly</li>
                <li>Withdrawals processed within 24 hours</li>
                <li>Bank transfers typically complete in 1-3 business days</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Wallets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p>The platform maintains separate wallets for each supported currency:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>NGN Wallet - For fiat transactions</li>
                <li>BTC Wallet - For Bitcoin transactions</li>
                <li>ETH Wallet - For Ethereum transactions</li>
                <li>USDT Wallet - For Tether transactions</li>
              </ul>
            </div>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                All wallet balances are automatically converted to NGN for reporting purposes using current market rates.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Security Measures</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Two-factor authentication (2FA) required for all withdrawals</li>
                <li>Daily withdrawal limits based on verification level</li>
                <li>IP-based login restrictions</li>
                <li>Regular security audits</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Compliance Requirements</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>KYC mandatory for all users</li>
                <li>Transaction monitoring for suspicious activity</li>
                <li>Regular reporting to regulatory authorities</li>
                <li>Compliance with anti-money laundering (AML) regulations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 