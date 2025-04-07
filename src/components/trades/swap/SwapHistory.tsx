'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

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

  const fetchTransactions = async (retryCount = 0) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      const fetchWithRetry = async () => {
        try {
          const { data: swapData, error: swapError } = await supabase
            .from('swap_transactions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (swapError) throw swapError;

          const { data: tradeData, error: tradeError } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('type', 'swap')
            .order('created_at', { ascending: false });

          if (tradeError) throw tradeError;

          return { swapData, tradeData };
        } catch (error) {
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
            return fetchWithRetry();
          }
          throw error;
        }
      };

      const { swapData, tradeData } = await fetchWithRetry();
      
      // Process and combine the data
      const combinedData = [...(swapData || []), ...(tradeData || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(combinedData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      if (retryCount < 3) {
        setTimeout(() => fetchTransactions(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load transaction history. Please try refreshing the page.',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000); // Refresh every 30 seconds
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
        <AlertDescription>No transactions found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        // Calculate the formatted amounts with null checks
        const fromAmount = formatNumber(parseFloat(transaction?.from_amount || '0'));
        const toAmount = formatNumber(parseFloat(transaction?.to_amount || '0'));
        const rate = formatNumber(parseFloat(transaction?.execution_price || '0'));
        
        return (
          <div
            key={transaction?.id || Math.random()}
            className="flex justify-between items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {fromAmount} {transaction?.from_currency?.toUpperCase() || 'N/A'} →{' '}
                  {toAmount} {transaction?.to_currency?.toUpperCase() || 'N/A'}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  swap
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate: {rate} {transaction?.to_currency?.toUpperCase() || 'N/A'}/{transaction?.from_currency?.toUpperCase() || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                {transaction?.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  transaction?.status === 'completed'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : transaction?.status === 'failed'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {transaction?.status || 'pending'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
} 