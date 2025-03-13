'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useBalance } from './BalanceContext';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'swap';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
}

export function TransactionHistory({ transactions = [] }: TransactionHistoryProps) {
  const { isHidden } = useBalance();
  // Only show the 5 most recent transactions
  const recentTransactions = transactions.slice(0, 5);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <Icons.download className="h-4 w-4" />;
      case 'withdraw':
        return <Icons.upload className="h-4 w-4" />;
      case 'swap':
        return <Icons.refresh className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        return 'Invalid date';
      }
      
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (typeof amount !== 'number') return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Recent Transactions</h2>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400">
            View All ↗
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 mb-6">
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">All</Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Deposits</Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Withdrawals</Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">Swaps</Button>
      </div>

      {recentTransactions.length > 0 ? (
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  tx.type === 'deposit' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                  tx.type === 'withdraw' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {getTypeIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200 capitalize">{tx.type}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(tx.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {isHidden ? '••••••' : `${tx.type === 'deposit' ? '+' : '-'}${formatAmount(tx.amount, tx.currency)} ${tx.currency}`}
                </p>
                <p className={`text-xs capitalize ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Icons.inbox className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-200">No transactions yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your transaction history will appear here once you make your first transaction.
          </p>
        </div>
      )}
    </div>
  );
} 