import { createClient } from '@supabase/supabase-js';
import { QuidaxService } from '@/lib/quidax';

interface AlertThresholds {
  large_transaction_threshold: number;
  balance_threshold: number;
  daily_volume_threshold: number;
}

interface Alert {
  type: 'large_transaction' | 'low_balance' | 'high_volume';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class MonitoringService {
  private supabase;
  private quidaxService;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.quidaxService = new QuidaxService(
      process.env.QUIDAX_SECRET_KEY,
      process.env.QUIDAX_API_URL
    );
  }

  async monitorTransactions() {
    try {
      // Get alert thresholds from settings
      const { data: thresholds } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'alert_thresholds')
        .single();

      const alertThresholds: AlertThresholds = thresholds?.value || {
        large_transaction_threshold: 10000, // USD
        balance_threshold: 5000, // USD
        daily_volume_threshold: 100000 // USD
      };

      // Monitor for large transactions
      const { data: largeTransactions } = await this.supabase
        .from('transactions')
        .select('*')
        .gt('amount_usd', alertThresholds.large_transaction_threshold)
        .eq('is_alerted', false);

      if (largeTransactions && largeTransactions.length > 0) {
        const alerts = largeTransactions.map(tx => ({
          type: 'large_transaction',
          severity: 'warning',
          message: `Large transaction detected: ${tx.amount_usd} USD in ${tx.currency}`,
          metadata: { transaction_id: tx.id, ...tx },
          timestamp: new Date().toISOString()
        }));

        // Insert alerts
        await this.supabase.from('alerts').insert(alerts);

        // Mark transactions as alerted
        await Promise.all(
          largeTransactions.map(tx =>
            this.supabase
              .from('transactions')
              .update({ is_alerted: true })
              .eq('id', tx.id)
          )
        );
      }

      // Monitor wallet balances
      const { data: wallets } = await this.supabase
        .from('wallet_balances')
        .select('*');

      if (wallets) {
        const lowBalanceWallets = wallets.filter(
          w => parseFloat(w.balance_usd) < alertThresholds.balance_threshold
        );

        if (lowBalanceWallets.length > 0) {
          const alerts = lowBalanceWallets.map(wallet => ({
            type: 'low_balance',
            severity: 'warning',
            message: `Low balance alert: ${wallet.currency} wallet below threshold`,
            metadata: { wallet },
            timestamp: new Date().toISOString()
          }));

          await this.supabase.from('alerts').insert(alerts);
        }
      }

      // Monitor daily volume
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: dailyVolume } = await this.supabase
        .from('transactions')
        .select('amount_usd')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      if (dailyVolume) {
        const totalVolume = dailyVolume.reduce(
          (sum, tx) => sum + (tx.amount_usd || 0),
          0
        );

        if (totalVolume > alertThresholds.daily_volume_threshold) {
          await this.supabase.from('alerts').insert({
            type: 'high_volume',
            severity: 'critical',
            message: `Daily volume exceeded threshold: ${totalVolume} USD`,
            metadata: { daily_volume: totalVolume },
            timestamp: new Date().toISOString()
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Monitoring error:', error);
      throw error;
    }
  }

  async getActiveAlerts() {
    const { data: alerts, error } = await this.supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return alerts;
  }

  async resolveAlert(alertId: string, resolvedBy: string) {
    return this.supabase
      .from('alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('id', alertId);
  }
} 