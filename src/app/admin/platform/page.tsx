'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { BarChart, PieChart } from '@/components/ui/charts';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletData {
  currency: string;
  balance: number;
  value: number;
}

interface RevenueData {
  month: string;
  total: number;
  quidax: number;
  platform: number;
}

interface TradeData {
  date: string;
  volume: number;
  revenue: number;
}

interface PlatformStats {
  accounts: {
    parent: {
      id: string;
      email: string;
    } | null;
    subAccounts: number;
  };
  wallets: {
    currency: string;
    balance: number;
    accountType: 'parent' | 'subaccount';
  }[];
  transactions: {
    id: string;
    date: string;
    amount: number;
    currency: string;
    accountType: 'parent' | 'subaccount';
  }[];
  marketData: Record<string, any>;
  totalRevenue?: number;
  revenueGrowth?: number;
  quidaxRevenue?: number;
  quidaxRevenuePercentage?: number;
  platformRevenue?: number;
  platformRevenuePercentage?: number;
  platformWallets?: WalletData[];
  monthlyRevenue?: RevenueData[];
  tradeVolume?: TradeData[];
}

interface ChartsData {
  chartData: any[];
}

export default function PlatformPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData(signal?: AbortSignal) {
    try {
      console.log('[FRONTEND] Fetching dashboard data...');
      
      const fetchOptions = signal ? { signal } : {};
      
      const [statsRes, chartsRes] = await Promise.all([
        fetch('/api/admin/platform/stats', fetchOptions).catch(e => {
          console.error('[FRONTEND] Stats fetch error:', e);
          throw e;
        }),
        fetch('/api/admin/platform/charts', fetchOptions).catch(e => {
          console.error('[FRONTEND] Charts fetch error:', e);
          throw e;
        })
      ]);

      if (!statsRes.ok || !chartsRes.ok) {
        const errorMsg = `API returned ${statsRes.status} or ${chartsRes.status}`;
        console.error('[FRONTEND] API error:', errorMsg);
        throw new Error(errorMsg);
      }

      const [stats, charts] = await Promise.all([
        statsRes.json(),
        chartsRes.json()
      ]);

      if (stats.status === 'error' || charts.status === 'error') {
        const errorMsg = stats.message || charts.message || 'API error';
        console.error('[FRONTEND] API response error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[FRONTEND] Data fetched successfully');
      const processedStats = {
        accounts: stats.data.accounts || { parent: null, subAccounts: 0 },
        wallets: stats.data.wallets || [],
        transactions: stats.data.transactions || [],
        marketData: stats.data.marketData || {}
      };

      setStats(processedStats);
      setCharts({ chartData: charts.chartData });
      setWarnings(stats.data.warnings || []);

      if (stats.data.warnings?.length > 0) {
        toast({
          title: "Partial Data Loaded",
          description: stats.data.warnings.join(', '),
          variant: "default",
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load platform stats',
          description: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (!stats || !charts) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium">Failed to load platform stats</p>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData}
        >
          Retry
        </Button>
      </div>
    );
  }

  const getWalletDistributionData = () => {
    if (!stats?.platformWallets) return [];
    return stats.platformWallets.map(wallet => ({
      name: wallet.currency,
      value: wallet.value,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Platform</h1>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Platform statistics are updated every 15 minutes
        </AlertDescription>
      </Alert>

      {warnings.length > 0 && (
        <Alert variant="default" className="bg-yellow-50 text-yellow-800">
          <AlertTitle>Partial Data Loaded</AlertTitle>
          <AlertDescription>
            Some data couldn't be loaded: {warnings.join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.totalRevenue && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue || 0, 'NGN')}
              </div>
              <div className="text-xs text-muted-foreground">
                {(stats.revenueGrowth || 0).toFixed(2)}% from last month
              </div>
            </CardContent>
          </Card>
        )}

        {stats.quidaxRevenue && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quidax Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.quidaxRevenue || 0, 'NGN')}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.quidaxRevenuePercentage ? stats.quidaxRevenuePercentage.toFixed(2) : '0.00'}% of total volume
              </div>
            </CardContent>
          </Card>
        )}

        {stats.platformRevenue && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.platformRevenue || 0, 'NGN')}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.platformRevenuePercentage ? stats.platformRevenuePercentage.toFixed(2) : '0.00'}% of total volume
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.wallets?.length ? (
              <PieChart
                data={getWalletDistributionData()}
                valueFormatter={(value) => formatCurrency(value, 'NGN')}
                colors={['#22C55E', '#16A34A', '#15803D', '#166534']}
              />
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center gap-2">
                <InfoIcon className="h-8 w-8 text-gray-400" />
                <p className="text-gray-500">No wallet data available</p>
                {warnings.includes('Failed to fetch wallet balances') && (
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    Retry
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
              <BarChart
                data={stats.monthlyRevenue}
                categories={['quidax']}
                valueFormatter={(value) => formatCurrency(value, 'NGN')}
                colors={['#22C55E']}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Trade Volume & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tradeVolume && stats.tradeVolume.length > 0 ? (
              <BarChart
                data={stats.tradeVolume}
                categories={['volume', 'revenue']}
                valueFormatter={(value) => formatCurrency(value, 'NGN')}
                colors={['#22C55E', '#16A34A']}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No trade data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 