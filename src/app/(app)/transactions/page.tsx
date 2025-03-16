'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  from_currency?: string;
  to_currency?: string;
  to_amount?: number;
  execution_price?: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'swaps'>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        
        // Fetch regular transactions
        const { data: regularTxs, error: regularError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (regularError) throw regularError;

        // Fetch swap transactions
        const { data: swapTxs, error: swapError } = await supabase
          .from('swap_transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (swapError) throw swapError;

        // Format regular transactions
        const formattedRegularTxs = (regularTxs || []).map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          status: tx.status,
          created_at: tx.created_at
        }));

        // Format swap transactions
        const formattedSwapTxs = (swapTxs || []).map(tx => ({
          id: tx.id,
          type: 'swap' as const,
          amount: parseFloat(tx.from_amount),
          currency: tx.from_currency,
          from_currency: tx.from_currency,
          to_currency: tx.to_currency,
          to_amount: parseFloat(tx.to_amount),
          execution_price: parseFloat(tx.execution_price),
          status: tx.status,
          created_at: tx.created_at
        }));

        // Combine and sort all transactions by date
        const allTransactions = [...formattedRegularTxs, ...formattedSwapTxs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'deposits') return tx.type === 'deposit';
    if (activeFilter === 'withdrawals') return tx.type === 'withdrawal';
    if (activeFilter === 'swaps') return tx.type === 'swap';
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 sm:gap-4 mb-6">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === 'deposits' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveFilter('deposits')}
            >
              Deposits
            </Button>
            <Button 
              variant={activeFilter === 'withdrawals' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveFilter('withdrawals')}
            >
              Withdrawals
            </Button>
            <Button 
              variant={activeFilter === 'swaps' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveFilter('swaps')}
            >
              Swaps
            </Button>
          </div>

          <TransactionList 
            transactions={filteredTransactions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
} 