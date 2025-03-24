'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'trade' | 'swap';
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  execution_price: string;
  status: string;
  created_at: string;
}

export function SwapHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);
        
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('No session found');
          return;
        }

        // Fetch both swap transactions and regular trades for the current user
        const [swapResponse, tradeResponse] = await Promise.all([
          supabase
            .from('swap_transactions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('trades')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('type', 'swap')
            .order('created_at', { ascending: false })
        ]);

        if (swapResponse.error) throw swapResponse.error;
        if (tradeResponse.error) throw tradeResponse.error;

        console.log('Swap transactions:', swapResponse.data);
        console.log('Trade swaps:', tradeResponse.data);

        // Format swap transactions
        const swapTransactions = (swapResponse.data || []).map(swap => ({
          id: swap.id,
          type: 'swap' as const,
          from_currency: swap.from_currency || swap.currency,
          to_currency: swap.to_currency || 'NGN',
          from_amount: swap.amount?.toString() || '0',
          to_amount: (swap.amount * (swap.rate || 0))?.toString() || '0',
          execution_price: swap.rate?.toString() || '0',
          status: swap.status || 'pending',
          created_at: swap.created_at
        }));

        // Format regular trades that are swaps
        const trades = (tradeResponse.data || []).map(trade => ({
          id: trade.id,
          type: 'swap' as const,
          from_currency: trade.currency?.toUpperCase() || 'UNKNOWN',
          to_currency: 'NGN',
          from_amount: trade.amount?.toString() || '0',
          to_amount: (trade.amount * (trade.rate || 0))?.toString() || '0',
          execution_price: trade.rate?.toString() || '0',
          status: trade.status || 'pending',
          created_at: trade.created_at
        }));

        // Combine and sort transactions by date
        const allTransactions = [...swapTransactions, ...trades].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('All transactions:', allTransactions);
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Failed to fetch transaction history:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
    const interval = setInterval(fetchTransactionHistory, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [supabase]);

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
        <AlertDescription>No transactions found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        // Calculate the formatted amounts
        const fromAmount = formatNumber(parseFloat(transaction.from_amount));
        const toAmount = formatNumber(parseFloat(transaction.to_amount));
        const rate = formatNumber(parseFloat(transaction.execution_price));
        
        return (
          <div
            key={transaction.id}
            className="flex justify-between items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {fromAmount} {transaction.from_currency.toUpperCase()} →{' '}
                  {toAmount} {transaction.to_currency.toUpperCase()}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  swap
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate: {rate} {transaction.to_currency}/{transaction.from_currency}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
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
            </div>
          </div>
        );
      })}
    </div>
  );
} 