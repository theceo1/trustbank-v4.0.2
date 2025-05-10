//src/app/(app)/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionService } from '@/lib/services/transaction-service';
import type { AnyTransaction, TransactionType } from '@/types/transactions';
import { Icons } from '@/components/ui/icons';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AnyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | TransactionType | 'swaps'>('all');
  const transactionService = new TransactionService();

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        const filters = activeFilter === 'all' 
          ? undefined 
          : activeFilter === 'swaps'
          ? { type: undefined }
          : { type: activeFilter };

        const transactions = await transactionService.getTransactions(filters);
        setTransactions(transactions);
      } catch (error) {
        // You might want to show an error toast here
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [activeFilter]);

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
              variant={activeFilter === 'deposit' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveFilter('deposit')}
            >
              Deposits
            </Button>
            <Button 
              variant={activeFilter === 'withdrawal' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveFilter('withdrawal')}
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

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icons.inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No transactions found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {activeFilter === 'all' 
                  ? "You haven't made any transactions yet."
                  : `You haven't made any ${activeFilter === 'swaps' ? 'swap' : activeFilter} transactions yet.`}
              </p>
            </div>
          ) : (
            <TransactionList transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 