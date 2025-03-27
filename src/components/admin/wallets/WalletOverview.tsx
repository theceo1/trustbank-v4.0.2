import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletStats {
  totalBalanceUSD: number;
  totalTransactions: number;
  activeWallets: number;
}

export function WalletOverview() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWalletStats() {
      try {
        const response = await fetch('/api/admin/wallets/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching wallet stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWalletStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>System wallet statistics and metrics</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>System wallet statistics and metrics</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Balance (USD)</p>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalBalanceUSD || 0, 'USD')}</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
            <p className="text-2xl font-bold">{stats?.activeWallets || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}