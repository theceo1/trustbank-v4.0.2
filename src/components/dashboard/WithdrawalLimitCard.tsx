'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';

const WITHDRAWAL_LIMITS = {
  NONE: 0,            // No KYC
  BASIC: 1000,        // Basic KYC - $1,000 limit
  INTERMEDIATE: 10000, // Intermediate KYC - $10,000 limit
  ADVANCED: 100000    // Advanced KYC - $100,000 limit
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
      // Use flat rate of 1600 NGN = 1 USD
      return formatNumber(limit * 1600, { style: 'currency', currency: 'NGN' });
    }
    return formatNumber(limit, { style: 'currency', currency: 'USD' });
  };

  return (
    <Card className="bg-[#3E2723] text-amber-100">
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
            <SelectTrigger className="w-[80px] h-8 bg-amber-900/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="NGN">NGN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-3xl font-bold">{formatWithdrawalLimit()}</p>
      </CardContent>
    </Card>
  );
} 