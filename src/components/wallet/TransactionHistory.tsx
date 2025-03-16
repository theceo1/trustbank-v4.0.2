'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useBalance } from './BalanceContext';
import Link from 'next/link';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  from_currency?: string;
  to_currency?: string;
  to_amount?: number;
  execution_price?: number;
  created_at?: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
}

export function TransactionHistory({ transactions = [] }: TransactionHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'swaps'>('all');

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'deposits') return tx.type === 'deposit';
    if (activeFilter === 'withdrawals') return tx.type === 'withdrawal';
    if (activeFilter === 'swaps') return tx.type === 'swap';
    return true;
  }).slice(0, 5); // Only take the first 5 transactions

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
      case 'withdrawal':
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
        <Button 
          variant={activeFilter === 'all' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveFilter('all')}
          className="text-xs"
        >
          All
        </Button>
        <Button 
          variant={activeFilter === 'deposits' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveFilter('deposits')}
          className="text-xs"
        >
          Deposits
        </Button>
        <Button 
          variant={activeFilter === 'withdrawals' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveFilter('withdrawals')}
          className="text-xs"
        >
          Withdrawals
        </Button>
        <Button 
          variant={activeFilter === 'swaps' ? 'default' : 'ghost'} 
          size="sm"
          onClick={() => setActiveFilter('swaps')}
          className="text-xs"
        >
          Swaps
        </Button>
      </div>

      <TransactionList 
        transactions={filteredTransactions.map(tx => {
          const transaction: any = {
            ...tx,
            created_at: tx.timestamp || tx.created_at
          };
          if (transaction.type === 'withdraw') {
            transaction.type = 'withdrawal';
          }
          return transaction;
        })} 
      />
    </div>
  );
} 