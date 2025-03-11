import { formatCurrency } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <Icons.download className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <Icons.upload className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <Icons.arrowRight className="h-4 w-4 text-blue-500" />;
      case 'swap':
        return <Icons.refresh className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-lg border"
        >
          <div className="flex items-center space-x-4">
            {getTransactionIcon(transaction.type)}
            <div>
              <p className="font-medium capitalize">
                {transaction.type}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <p className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 