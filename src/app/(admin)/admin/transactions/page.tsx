'use client';

import { TransactionList } from '@/components/admin/transactions/TransactionList';

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground">
          View and manage all transactions in the system
        </p>
      </div>
      <TransactionList />
    </div>
  );
} 