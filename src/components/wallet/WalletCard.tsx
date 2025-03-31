'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { formatCurrency } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBalance } from './BalanceContext';

interface WalletCardProps {
  currency: string;
  balance: string;
  price?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onSwap?: () => void;
  expanded?: boolean;
}

export function WalletCard({
  currency,
  balance,
  price,
  onDeposit,
  onWithdraw,
  onSwap,
  expanded = true,
}: WalletCardProps) {
  const { isHidden } = useBalance();
  
  // Calculate fiat value
  const calculateFiatValue = (balance: number, price: number, currency: string) => {
    if (currency.toUpperCase() === 'NGN') {
      return balance;
    }

    // Ensure we have valid numbers and multiply
    const numericBalance = parseFloat(String(balance)) || 0;
    const numericPrice = parseFloat(String(price)) || 0;
    const value = numericBalance * numericPrice;
    
    return value;
  };

  const fiatValue = calculateFiatValue(parseFloat(balance || '0'), price || 0, currency);

  const formatBalance = (balance: number, currency: string) => {
    const numericBalance = parseFloat(String(balance)) || 0;
    
    if (currency.toUpperCase() === 'NGN') {
      return `₦${numericBalance.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }

    // For BTC, show more decimal places
    if (currency.toUpperCase() === 'BTC') {
      return numericBalance.toLocaleString('en-US', {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8
      });
    }

    // For other cryptocurrencies
    return numericBalance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatFiatValue = (value: number) => {
    const numericValue = parseFloat(String(value)) || 0;
    return `₦${numericValue.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="rounded-xl border bg-card shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow duration-200">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {currency.toUpperCase()}
        </h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isHidden ? '••••••' : formatBalance(parseFloat(balance || '0'), currency)}
        </p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Value</p>
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
          {isHidden ? '••••••' : formatFiatValue(fiatValue)}
        </p>
      </div>

      {(onDeposit || onWithdraw || onSwap) && (
        <div className="grid grid-cols-3 gap-2">
          {onDeposit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeposit}
                    className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  >
                    <Icons.download className="h-4 w-4" />
                    {expanded && <span className="ml-2">Deposit</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deposit {currency.toUpperCase()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onWithdraw && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onWithdraw}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                  >
                    <Icons.upload className="h-4 w-4" />
                    {expanded && <span className="ml-2">Withdraw</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Withdraw {currency.toUpperCase()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onSwap && currency.toUpperCase() !== 'NGN' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSwap}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 hover:border-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                  >
                    <Icons.refresh className="h-4 w-4" />
                    {expanded && <span className="ml-2">Swap</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Swap {currency.toUpperCase()} for other currencies</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
} 