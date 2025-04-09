'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Shield, Wallet, ArrowUpDown, Star, ChevronRight, Lock, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { motion } from "framer-motion";

// KYC Tiers with trading limits
const KYC_TIERS = {
  TIER_1: {
    name: 'Basic',
    icon: <Shield className="h-5 w-5 text-green-600" />,
    requirements: [
      'Email Verification',
      'Phone Number Verification',
      'Basic Personal Information'
    ],
    features: [
      'Basic trading features',
      'Limited trading volume',
      'Basic support'
    ],
    dailyLimit: 100, // 100 USD
    monthlyLimit: 1000, // 1K USD
    withdrawalLimit: 200, // 200 USD
  },
  TIER_2: {
    name: 'Starter',
    icon: <Star className="h-5 w-5 text-green-600" />,
    requirements: [
      'All Basic Tier Requirements',
      'NIN Verification',
      'Selfie Verification'
    ],
    features: [
      'Increased trading limits',
      'Priority support',
      'Access to OTC trading'
    ],
    dailyLimit: 500, // 500 USD
    monthlyLimit: 5000, // 5K USD
    withdrawalLimit: 1000, // 1K USD
  },
  TIER_3: {
    name: 'Intermediate',
    icon: <ArrowUpDown className="h-5 w-5 text-green-600" />,
    requirements: [
      'All Starter Tier Requirements',
      'BVN Verification'
    ],
    features: [
      'Higher trading limits',
      'Lower trading fees',
      'Dedicated support line'
    ],
    dailyLimit: 2000, // 2K USD
    monthlyLimit: 20000, // 20K USD
    withdrawalLimit: 5000, // 5K USD
  },
  TIER_4: {
    name: 'Advanced',
    icon: <Lock className="h-5 w-5 text-green-600" />,
    requirements: [
      'All Intermediate Tier Requirements',
      'LiveCheck Verification'
    ],
    features: [
      'Premium trading limits',
      'VIP support',
      'Advanced trading tools',
      'Exclusive market insights'
    ],
    dailyLimit: 10000, // 10K USD
    monthlyLimit: 100000, // 100K USD
    withdrawalLimit: 20000, // 20K USD
  },
  TIER_5: {
    name: 'Premium',
    icon: <Crown className="h-5 w-5 text-green-600" />,
    requirements: [
      'All Advanced Tier Requirements',
      'Government-issued ID',
      'International Passport'
    ],
    features: [
      'Highest trading limits',
      'Lowest trading fees',
      'Dedicated account manager',
      'Premium support',
      'Advanced trading features',
      'Early access to new features'
    ],
    dailyLimit: 50000, // 50K USD
    monthlyLimit: 500000, // 500K USD
    withdrawalLimit: 100000, // 100K USD
  }
};

// Volume-based fee tiers
const VOLUME_TIERS = {
  TIER_1: { min: 0, max: 1000, fee: 4.0 },        // 0-1K USD: 4.0%
  TIER_2: { min: 1000, max: 5000, fee: 3.5 },     // 1K-5K USD: 3.5%
  TIER_3: { min: 5000, max: 20000, fee: 3.0 },    // 5K-20K USD: 3.0%
  TIER_4: { min: 20000, max: 100000, fee: 2.8 },  // 20K-100K USD: 2.8%
  TIER_5: { min: 100000, max: Infinity, fee: 2.5 }  // 100K+ USD: 2.5%
};

export default function TradingGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/50 dark:from-green-950/50 dark:via-background dark:to-green-950/50">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h1 className="text-lg font-bold sm:text-2xl md:text-3xl">
            <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              Trading Tiers
            </span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features and higher limits as you progress through our verification tiers
          </p>
        </motion.div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Identity Verification</AlertTitle>
          <AlertDescription>
            Our secure identity verification system adapts to your trading needs. As your trading activity grows, we may request additional verification to ensure the safety of your account and maintain compliance with regulations.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>KYC Tiers & Trading Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(KYC_TIERS).map(([tier, info], index) => (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg border p-6 bg-gradient-to-r from-green-600/5 to-transparent"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <h3 className="text-lg font-semibold">{info.name}</h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {info.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {info.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Trading Limits</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>Daily: {formatCurrency(info.dailyLimit, 'USD')}</li>
                        <li>Monthly: {formatCurrency(info.monthlyLimit, 'USD')}</li>
                        <li>Withdrawal: {formatCurrency(info.withdrawalLimit, 'USD')}</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Fee Tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Trading Fee Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Volume-Based Discounts</AlertTitle>
                <AlertDescription>
                  Our fee structure rewards higher trading volumes with lower fees. The more you trade,
                  the less you pay in fees. Volume is calculated based on your 30-day trading history.
                </AlertDescription>
              </Alert>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier Level</TableHead>
                    <TableHead>30-Day Volume (USD)</TableHead>
                    <TableHead>Trading Fee</TableHead>
                    <TableHead>Features</TableHead>
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
                      <TableCell>
                        <ul className="list-disc list-inside">
                          <li>Priority Support</li>
                          {index >= 2 && <li>OTC Trading</li>}
                          {index >= 3 && <li>Dedicated Account Manager</li>}
                          {index >= 4 && <li>Custom Solutions</li>}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert className="bg-primary/10 border-primary/20">
                <ArrowUpDown className="h-4 w-4" />
                <AlertTitle>Additional Fee Information</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    <li>Get 0.1% fee discount for each successful referral (up to 0.5%)</li>
                    <li>Network fees vary by cryptocurrency and are displayed during trading</li>
                    <li>Volume is calculated in USD based on your 30-day trading activity</li>
                    <li>All fees are transparent and displayed before each trade</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 