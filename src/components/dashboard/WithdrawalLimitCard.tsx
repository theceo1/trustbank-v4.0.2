'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';

// Use the same withdrawal limits as defined in KYC tiers
const WITHDRAWAL_LIMITS = {
  NONE: 0,            // No KYC
  BASIC: 200,         // Basic KYC - $200 limit
  INTERMEDIATE: 5000,  // Intermediate KYC - $5,000 limit
  ADVANCED: 20000,    // Advanced KYC - $20,000 limit
  PREMIUM: 100000     // Premium KYC - $100,000 limit
};

interface WithdrawalLimitCardProps {
  hasBasicKyc: boolean;
  hasIntermediateKyc: boolean;
  hasAdvancedKyc: boolean;
}

export function WithdrawalLimitCard({ hasBasicKyc, hasIntermediateKyc, hasAdvancedKyc }: WithdrawalLimitCardProps) {
  const [withdrawalCurrency, setWithdrawalCurrency] = useState<'USD' | 'NGN'>('USD');

  // Determine withdrawal limit based on KYC level
  const getWithdrawalLimit = () => {
    if (hasAdvancedKyc) return WITHDRAWAL_LIMITS.ADVANCED;
    if (hasIntermediateKyc) return WITHDRAWAL_LIMITS.INTERMEDIATE;
    if (hasBasicKyc) return WITHDRAWAL_LIMITS.BASIC;
    return WITHDRAWAL_LIMITS.NONE;
  };

  // Format withdrawal limit based on selected currency
  const formatWithdrawalLimit = () => {
    const limit = getWithdrawalLimit();
    if (withdrawalCurrency === 'NGN') {
      // Use flat rate of 1600 NGN = 1 USD for display only
      return formatNumber(limit * 1600, { style: 'currency', currency: 'NGN' });
    }
    return formatNumber(limit, { style: 'currency', currency: 'USD' });
  };

  return (
    <Card className="bg-gradient-to-br from-amber-900/90 to-amber-800/90 text-amber-100">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Withdrawal Limit</h3>
            <p className="text-sm opacity-80">Your remaining withdrawal limit</p>
          </div>
          <Select 
            value={withdrawalCurrency} 
            onValueChange={(value: 'USD' | 'NGN') => setWithdrawalCurrency(value)}
          >
            <SelectTrigger className="w-[80px] h-8 bg-amber-900/50 border-amber-700/50 text-amber-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-amber-900 border-amber-700">
              <SelectItem value="USD" className="text-amber-100 hover:bg-amber-800 focus:bg-amber-800">USD</SelectItem>
              <SelectItem value="NGN" className="text-amber-100 hover:bg-amber-800 focus:bg-amber-800">NGN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-3xl font-bold">{formatWithdrawalLimit()}</p>
      </CardContent>
    </Card>
  );
} 