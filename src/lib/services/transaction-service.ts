import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import {
  Transaction,
  SwapTransaction,
  TransactionFilters,
  TransactionSort,
  AnyTransaction
} from '@/types/transactions';

export class TransactionService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  async getTransactions(
    filters?: TransactionFilters,
    sort?: TransactionSort,
    limit?: number
  ): Promise<AnyTransaction[]> {
    try {
      // Build regular transactions query
      let transactionQuery = this.supabase
        .from('transactions')
        .select('*');

      // Build swap transactions query
      let swapQuery = this.supabase
        .from('swap_transactions')
        .select('*');

      // Apply filters
      if (filters) {
        if (filters.status) {
          transactionQuery = transactionQuery.eq('status', filters.status);
          swapQuery = swapQuery.eq('status', filters.status);
        }

        if (filters.type) {
          transactionQuery = transactionQuery.eq('type', filters.type);
        }

        if (filters.currency) {
          transactionQuery = transactionQuery.eq('currency', filters.currency);
          swapQuery = swapQuery.or(`from_currency.eq.${filters.currency},to_currency.eq.${filters.currency}`);
        }

        if (filters.startDate) {
          transactionQuery = transactionQuery.gte('created_at', filters.startDate.toISOString());
          swapQuery = swapQuery.gte('created_at', filters.startDate.toISOString());
        }

        if (filters.endDate) {
          transactionQuery = transactionQuery.lte('created_at', filters.endDate.toISOString());
          swapQuery = swapQuery.lte('created_at', filters.endDate.toISOString());
        }
      }

      // Apply sorting
      if (sort) {
        transactionQuery = transactionQuery.order(sort.field, {
          ascending: sort.direction === 'asc'
        });
        swapQuery = swapQuery.order(sort.field, {
          ascending: sort.direction === 'asc'
        });
      } else {
        // Default sort by created_at desc
        transactionQuery = transactionQuery.order('created_at', { ascending: false });
        swapQuery = swapQuery.order('created_at', { ascending: false });
      }

      // Apply limit if specified
      if (limit) {
        transactionQuery = transactionQuery.limit(limit);
        swapQuery = swapQuery.limit(limit);
      }

      // Execute both queries in parallel
      const [{ data: regularTxs, error: regularError }, { data: swapTxs, error: swapError }] = await Promise.all([
        transactionQuery,
        swapQuery
      ]);

      if (regularError) throw regularError;
      if (swapError) throw swapError;

      // Combine and sort results
      const allTransactions: AnyTransaction[] = [
        ...(regularTxs || []).map(tx => ({
          ...tx,
          amount: parseFloat(tx.amount.toString()),
        })),
        ...(swapTxs || []).map(tx => ({
          ...tx,
          from_amount: parseFloat(tx.from_amount.toString()),
          to_amount: parseFloat(tx.to_amount.toString()),
          execution_price: parseFloat(tx.execution_price.toString()),
        }))
      ];

      // Final sort by created_at
      return allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async createSwapTransaction(transaction: Omit<SwapTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('swap_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating swap transaction:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<Transaction | SwapTransaction | null> {
    try {
      // Try to find in regular transactions
      const { data: regularTx, error: regularError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (regularTx) return regularTx;

      // If not found, try swap transactions
      const { data: swapTx, error: swapError } = await this.supabase
        .from('swap_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (swapError && !swapTx) return null;
      return swapTx;
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      throw error;
    }
  }
} 