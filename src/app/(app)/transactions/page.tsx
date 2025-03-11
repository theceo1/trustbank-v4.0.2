'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { TransactionList } from '@/components/transactions/TransactionList';
import type { Database } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadTransactions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (transactionsError) throw transactionsError;
        if (data) {
          setTransactions(data as Transaction[]);
        }
      } catch (err: any) {
        console.error('Error loading transactions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, [supabase]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      </div>
      {error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 