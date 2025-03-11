'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBalance } from './BalanceContext';

interface PortfolioValueProps {
  value: number;
}

export function PortfolioValue({ value }: PortfolioValueProps) {
  const { isHidden, toggleHidden } = useBalance();
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Total Portfolio Value</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Your total balance across all wallets</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-600 dark:text-gray-400"
                  onClick={toggleHidden}
                >
                  <Icons.eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isHidden ? 'Show balance' : 'Hide balance'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-600 dark:text-gray-400"
                  onClick={handleRefresh}
                >
                  <Icons.refresh className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh balances</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isHidden ? '••••••' : `₦ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
    </div>
  );
} 