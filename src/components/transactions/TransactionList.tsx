import { formatCurrency } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { format, isValid, parseISO } from 'date-fns';
import type { AnyTransaction } from '@/types/transactions';

interface TransactionListProps {
  transactions: AnyTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const getTransactionIcon = (transaction: AnyTransaction) => {
    const type = 'type' in transaction ? transaction.type : 'swap';
    switch (type) {
      case 'deposit':
        return <Icons.download className="h-4 w-4" />;
      case 'withdrawal':
        return <Icons.upload className="h-4 w-4" />;
      case 'swap':
        return <Icons.refresh className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-900/50';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50';
      case 'failed':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-900/50';
    }
  };

  const getIconBackground = (transaction: AnyTransaction) => {
    const type = 'type' in transaction ? transaction.type : 'swap';
    switch (type) {
      case 'deposit':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'withdrawal':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
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

  return (
    <div className="space-y-1">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className={`p-2 rounded-lg ${getIconBackground(transaction)}`}>
            {getTransactionIcon(transaction)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {'type' in transaction ? transaction.type : 'Swap'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </p>
              </div>
              
              <div className="text-right">
                {'from_currency' in transaction ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(transaction.from_amount, transaction.from_currency)} →{' '}
                      {formatCurrency(transaction.to_amount, transaction.to_currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rate: {formatCurrency(transaction.execution_price, transaction.to_currency)}
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