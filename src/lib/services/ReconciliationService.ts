import { createClient } from '@supabase/supabase-js';
import { QuidaxService, QuidaxWallet, SwapTransaction } from '@/lib/quidax';

interface LocalWallet {
  currency: string;
  balance: string;
  last_reconciled_at: string;
}

interface LocalTransaction {
  external_id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  metadata: Record<string, any>;
}

interface ReconciliationState {
  last_transaction_check: string;
}

export class ReconciliationService {
  private supabase;
  private quidaxService;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.quidaxService = new QuidaxService(
      process.env.QUIDAX_API_URL,
      process.env.QUIDAX_SECRET_KEY
    );
  }

  async reconcileWallets() {
    try {
      // Fetch all wallets from Quidax
      const quidaxWallets = await this.quidaxService.getWallets();
      
      // Fetch all wallet records from our database
      const { data: localWallets, error: dbError } = await this.supabase
        .from('wallet_balances')
        .select('*');

      if (dbError) throw dbError;

      // Compare and update discrepancies
      const discrepancies = [];
      for (const qWallet of quidaxWallets) {
        const localWallet = localWallets?.find(
          (w: LocalWallet) => w.currency === qWallet.currency
        );
        
        if (!localWallet || localWallet.balance !== qWallet.balance) {
          discrepancies.push({
            currency: qWallet.currency,
            quidax_balance: qWallet.balance,
            local_balance: localWallet?.balance || '0',
            timestamp: new Date().toISOString()
          });

          // Update local balance
          await this.supabase
            .from('wallet_balances')
            .upsert({
              currency: qWallet.currency,
              balance: qWallet.balance,
              last_reconciled_at: new Date().toISOString()
            });
        }
      }

      // Log discrepancies if any
      if (discrepancies.length > 0) {
        await this.supabase
          .from('reconciliation_logs')
          .insert(discrepancies);
      }

      return {
        success: true,
        discrepancies_found: discrepancies.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Reconciliation error:', error);
      throw error;
    }
  }

  async reconcileTransactions() {
    try {
      // Get last reconciled timestamp
      const { data: lastReconciled } = await this.supabase
        .from('reconciliation_state')
        .select('last_transaction_check')
        .single();

      // Fetch transactions from Quidax since last check
      const quidaxTransactions = await this.quidaxService.getSwapTransactions(
        'me',
        lastReconciled?.last_transaction_check
      );

      // Compare with local transactions
      const { data: localTransactions } = await this.supabase
        .from('transactions')
        .select('*')
        .gte('created_at', lastReconciled?.last_transaction_check);

      // Find missing transactions
      const missingTransactions = quidaxTransactions.filter(
        (qt: SwapTransaction) =>
          !localTransactions?.some(
            (lt: LocalTransaction) => lt.external_id === qt.id
          )
      );

      // Add missing transactions to our database
      if (missingTransactions.length > 0) {
        await this.supabase
          .from('transactions')
          .insert(missingTransactions.map((t: SwapTransaction) => ({
            external_id: t.id,
            type: t.from_currency ? 'swap' : 'transfer',
            status: t.status,
            amount: t.from_amount,
            currency: t.from_currency,
            metadata: t
          })));
      }

      // Update last reconciled timestamp
      await this.supabase
        .from('reconciliation_state')
        .update({ last_transaction_check: new Date().toISOString() })
        .eq('id', 1);

      return {
        success: true,
        missing_transactions: missingTransactions.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transaction reconciliation error:', error);
      throw error;
    }
  }
} 