import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed supabase and session logic for unauthenticated debug
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Set up polling for updates
  useEffect(() => {
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('transaction_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!transactions.length) {
    return <div className="text-gray-500">No transactions found</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{transaction.type}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(transaction.created_at), 'PPpp')}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-medium ${
                transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
              }`}>
                {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} {transaction.currency}
              </p>
              <p className="text-sm text-gray-500">{transaction.status}</p>
            </div>
          </div>
          {transaction.description && (
            <p className="text-sm text-gray-600 mt-2">{transaction.description}</p>
          )}
        </div>
      ))}
    </div>
  );
} 