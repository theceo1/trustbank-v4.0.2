'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoIcon, Shield, Wallet, ArrowUpDown, DollarSign, LineChart, Users } from 'lucide-react';
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

// Volume-based fee tiers
const VOLUME_TIERS = {
  TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
  TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
  TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
  TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
  TIER_5: { min: 100000, max: Infinity, fee: 2.5 } // 100K+ USD: 2.5%
};

export default function TradeGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/50 dark:from-green-950/50 dark:via-background dark:to-green-950/50">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h1 className="text-lg font-bold sm:text-2xl md:text-3xl">
            <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Admin Trade Guide
            </span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Comprehensive guide for managing trading operations and revenue generation
          </p>
        </motion.div>

        {/* Revenue Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Revenue Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Base Fee Structure</AlertTitle>
              <AlertDescription>
                The platform operates on a tiered fee structure with Quidax charging a base 1.4% for payment and wallet services.
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Component</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Quidax Base Fee</TableCell>
                  <TableCell>1.4%</TableCell>
                  <TableCell>Payment and wallet infrastructure</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Platform Fee</TableCell>
                  <TableCell>Variable</TableCell>
                  <TableCell>Based on user's trading volume tier</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Network Fee</TableCell>
                  <TableCell>Variable</TableCell>
                  <TableCell>Depends on blockchain network conditions</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Volume-Based Fee Tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-6 w-6 text-green-600" />
              Volume-Based Fee Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Trading fees are calculated based on the user's 30-day trading volume. Higher volumes qualify for lower fees.
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier Level</TableHead>
                  <TableHead>30-Day Volume (USD)</TableHead>
                  <TableHead>Trading Fee</TableHead>
                  <TableHead>Net Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(VOLUME_TIERS).map(([key, tier], index) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">Tier {index + 1}</TableCell>
                    <TableCell>
                      {tier.max === Infinity
                        ? `${formatCurrency(tier.min, 'USD')}+`
                        : `${formatCurrency(tier.min, 'USD')} - ${formatCurrency(tier.max, 'USD')}`}
                    </TableCell>
                    <TableCell>{tier.fee}%</TableCell>
                    <TableCell>{(tier.fee - 1.4).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Trading Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-6 w-6 text-green-600" />
              Trading Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Transaction Flow</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>User initiates trade request</li>
                  <li>System validates user's KYC level and limits</li>
                  <li>Fee calculation based on volume tier</li>
                  <li>Trade execution and settlement</li>
                  <li>Revenue distribution (Platform vs Quidax)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Monitoring Requirements</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>Real-time transaction monitoring</li>
                  <li>Volume tracking per user</li>
                  <li>Fee calculation verification</li>
                  <li>Settlement confirmation</li>
                  <li>Revenue reconciliation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance and Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Compliance and Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-primary/10 border-primary/20">
              <Shield className="h-4 w-4" />
              <AlertTitle>Important Security Measures</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  <li>Mandatory 2FA for all withdrawals</li>
                  <li>IP-based login restrictions</li>
                  <li>Regular security audits</li>
                  <li>Transaction monitoring for suspicious activity</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">KYC Requirements</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>Identity verification</li>
                  <li>Address verification</li>
                  <li>Source of funds declaration</li>
                  <li>Regular KYC updates</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Regulatory Compliance</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>AML monitoring</li>
                  <li>Transaction reporting</li>
                  <li>Record keeping</li>
                  <li>Regulatory updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Wallets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-green-600" />
              Platform Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                All wallet balances are automatically converted to NGN for reporting purposes using current market rates.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Supported Wallets</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>NGN Wallet - Fiat transactions</li>
                  <li>BTC Wallet - Bitcoin transactions</li>
                  <li>ETH Wallet - Ethereum transactions</li>
                  <li>USDT Wallet - Tether transactions</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Wallet Management</h3>
                <ul className="space-y-2 list-disc pl-6">
                  <li>Regular balance reconciliation</li>
                  <li>Hot/Cold wallet distribution</li>
                  <li>Withdrawal approval process</li>
                  <li>Balance monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 