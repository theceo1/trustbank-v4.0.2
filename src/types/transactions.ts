export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SwapTransaction {
  id: string;
  user_id: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  execution_price: number;
  status: TransactionStatus;
  reference?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type AnyTransaction = Transaction | SwapTransaction;

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TransactionSort {
  field: keyof Transaction | keyof SwapTransaction;
  direction: 'asc' | 'desc';
} 