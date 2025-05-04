import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
}

interface WalletUpdatesProps {
  balance: number;
  currency: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  isLoading?: boolean;
  isProcessing?: boolean;
  error?: string;
}

export default function WalletUpdates({
  balance,
  currency,
  onDeposit,
  onWithdraw,
  isLoading = false,
  isProcessing = false,
  error,
}: WalletUpdatesProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setTransactions(data || []);
    };

    fetchTransactions();
  }, [supabase]);

  if (isLoading) {
    return <div data-testid="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const formattedBalance = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return (
    <div>
      <div>
        <h2>Wallet Balance</h2>
        <p>{formattedBalance} {currency}</p>
      </div>
      
      <div>
        <button 
          onClick={onDeposit} 
          disabled={isProcessing}
        >
          Deposit
        </button>
        <button 
          onClick={onWithdraw} 
          disabled={isProcessing}
        >
          Withdraw
        </button>
      </div>

      <div>
        <h3>Recent Transactions</h3>
        {transactions.length > 0 ? (
          <ul>
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                {transaction.type}: {transaction.amount} {currency} - {transaction.status}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent transactions</p>
        )}
      </div>
    </div>
  );
} 