'use client';

import { useEffect, useState } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';

interface AnyTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

interface TransactionHistoryProps {
  transactions?: AnyTransaction[];
  limit?: number;
  filterType?: string;
  showFilters?: boolean;
  header?: string;
  emptyMessage?: string;
  loading?: boolean;
  refreshKey?: number;
}

export default function TransactionHistory({
  transactions: propTransactions,
  limit = 5,
  filterType,
  showFilters = true,
  header = '',
  emptyMessage = 'No transactions found',
  loading: propLoading,
  refreshKey
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions only if not provided as prop
  useEffect(() => {
    let ignore = false;
    if (!propTransactions) {
      setLoading(true);
      fetch('/api/transactions')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch transactions');
          return res.json();
        })
        .then(data => { if (!ignore) setTransactions(data); })
        .catch(err => { if (!ignore) setError(err.message); })
        .finally(() => { if (!ignore) setLoading(false); });
    }
    return () => { ignore = true; };
  }, [propTransactions, refreshKey]);

  const allTransactions = propTransactions || transactions;

  // Filtering
  const filtered = filterType && filterType !== 'all'
    ? allTransactions.filter(tx => tx.type === filterType)
    : allTransactions;
  const limited = limit ? filtered.slice(0, limit) : filtered;

  // Loading state
  const isLoading = typeof propLoading === 'boolean' ? propLoading : loading;

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-6 shadow-lg">
      {header && <h2 className="text-lg font-semibold mb-4">{header}</h2>}
      {showFilters && (
        <div className="flex gap-2 mb-4">
          {['all', 'deposit', 'withdrawal', 'swap'].map(type => (
            <button
              key={type}
              className={`px-3 py-1 rounded text-xs font-medium border ${filterType === type ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'} transition`}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('transaction-filter', { detail: { type } });
                  window.dispatchEvent(event);
                }
              }}
              type="button"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="animate-pulse">Loading transactions...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : limited.length === 0 ? (
        <div className="text-gray-500">{emptyMessage}</div>
      ) : (
        <TransactionList transactions={limited} />
      )}
    </div>
  );
}