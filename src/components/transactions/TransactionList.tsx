import { formatCurrency } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { format, isValid, parseISO } from 'date-fns';

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

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icons.inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No transactions yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          When you make transactions, they will appear here.
        </p>
      </div>
    );
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <Icons.download className="h-4 w-4" />;
      case 'withdrawal':
        return <Icons.upload className="h-4 w-4" />;
      case 'transfer':
        return <Icons.arrowRight className="h-4 w-4" />;
      case 'swap':
        return <Icons.refresh className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-900/50';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50';
      case 'failed':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-900/50';
    }
  };

  const getIconBackground = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'withdrawal':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'transfer':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'swap':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-1">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className={`p-2 rounded-lg ${getIconBackground(transaction.type)}`}>
            {getTransactionIcon(transaction.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {transaction.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </p>
              </div>
              
              <div className="text-right">
                {transaction.type === 'swap' ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(transaction.amount, transaction.from_currency || '')} →{' '}
                      {formatCurrency(transaction.to_amount || 0, transaction.to_currency || '')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rate: {transaction.execution_price}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {transaction.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium mt-1 border ${getStatusColor(
                    transaction.status
                  )}`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 