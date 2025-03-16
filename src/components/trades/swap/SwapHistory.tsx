'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  rate: string;
  status: string;
  created_at: string;
}

export function SwapHistory() {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSwapHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('type', 'swap')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTransactions = (data || []).map(trade => ({
          id: trade.id,
          from_currency: trade.from_currency,
          to_currency: trade.to_currency,
          from_amount: trade.from_amount?.toString() || '0',
          to_amount: trade.to_amount?.toString() || '0',
          rate: trade.price?.toString() || '0',
          status: trade.status || 'pending',
          created_at: trade.created_at
        }));

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Failed to fetch swap history:', error);
        setError('Failed to load swap history');
      } finally {
        setLoading(false);
      }
    };

    fetchSwapHistory();
    const interval = setInterval(fetchSwapHistory, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (transactions.length === 0) {
    return (
      <Alert>
        <AlertDescription>No swap transactions found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex justify-between items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {transaction.from_amount} {transaction.from_currency} →{' '}
              {transaction.to_amount} {transaction.to_currency}
            </p>
            <p className="text-xs text-muted-foreground">
              Rate: {transaction.rate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  transaction.status === 'completed'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : transaction.status === 'failed'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {transaction.status}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(transaction.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 