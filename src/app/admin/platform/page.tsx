'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { BarChart } from '@/components/ui/charts';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalWallets: number;
}

interface ChartData {
  date: string;
  transactions: number;
  volume: number;
  newUsers: number;
}

interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: PlatformStats;
  chartData?: ChartData[];
  lastUpdated?: string;
}

export default function PlatformPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[PLATFORM PAGE] Initializing component');
    fetchDashboardData();
  }, []);

  async function fetchDashboardData(signal?: AbortSignal) {
    try {
      console.log('[PLATFORM PAGE] Fetching dashboard data...');
      
      const fetchOptions = signal ? { signal } : {};
      
      const [statsRes, chartsRes] = await Promise.all([
        fetch('/api/admin/platform/stats', fetchOptions),
        fetch('/api/admin/platform/charts', fetchOptions)
      ]);

      console.log('[PLATFORM PAGE] Stats response:', statsRes);
      console.log('[PLATFORM PAGE] Charts response:', chartsRes);

      if (!statsRes.ok || !chartsRes.ok) {
        throw new Error(`API returned ${statsRes.status} or ${chartsRes.status}`);
      }

      const [statsData, chartsData] = await Promise.all([
        statsRes.json(),
        chartsRes.json()
      ]) as [ApiResponse, ApiResponse];

      console.log('[PLATFORM PAGE] Stats data:', statsData);
      console.log('[PLATFORM PAGE] Charts data:', chartsData);

      if (statsData.status === 'error' || chartsData.status === 'error') {
        throw new Error(statsData.message || chartsData.message || 'API error');
      }

      console.log('[PLATFORM PAGE] Data fetched successfully');
      setStats(statsData.data || null);
      setChartData(chartsData.chartData || null);
      setLastUpdated(statsData.lastUpdated || null);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
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
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[125px] w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>
    );
  }

  if (!stats || !chartData) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium">Failed to load platform stats</p>
        <Button 
          variant="outline" 
          onClick={() => fetchDashboardData()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Platform</h1>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Platform statistics are updated every 15 minutes
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.activeUsers)} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume, 'NGN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalWallets)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartData}
              categories={['volume']}
              valueFormatter={(value: number) => formatCurrency(value, 'NGN')}
              colors={['#22C55E']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartData}
              categories={['transactions']}
              valueFormatter={(value: number) => formatNumber(value)}
              colors={['#22C55E']}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Trade Volume & Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartData}
            categories={['volume', 'newUsers']}
            valueFormatter={(value: number) => formatCurrency(value, 'NGN')}
            colors={['#22C55E', '#16A34A']}
          />
        </CardContent>
      </Card>

      {lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
} 