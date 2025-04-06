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

interface RevenueStats {
  totalRevenue: number;
  quidaxFees: number;
  netRevenue: number;
  feeBreakdown: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
  };
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalWallets: number;
  revenue: RevenueStats;
  userSegmentation: {
    tier1: number;  // Basic
    tier2: number;  // Starter
    tier3: number;  // Intermediate
    tier4: number;  // Advanced
    tier5: number;  // Premium
  };
  topWallets: Array<{
    currency: string;
    balance: string;
    converted_balance: string;
    name: string;
  }>;
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
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume, 'NGN')}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.netRevenue, 'NGN')}</div>
            <p className="text-xs text-muted-foreground">
              After Quidax fees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={{
                labels: ['Basic', 'Starter', 'Intermediate', 'Advanced', 'Premium'],
                datasets: [{
                  label: 'Users',
                  data: [
                    stats.userSegmentation.tier1,
                    stats.userSegmentation.tier2,
                    stats.userSegmentation.tier3,
                    stats.userSegmentation.tier4,
                    stats.userSegmentation.tier5
                  ],
                  backgroundColor: ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'],
                  borderColor: ['#16A34A', '#2563EB', '#D97706', '#7C3AED', '#DB2777']
                }]
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={{
                labels: ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Quidax Fees'],
                datasets: [{
                  label: 'Revenue',
                  data: [
                    stats.revenue.feeBreakdown.tier1,
                    stats.revenue.feeBreakdown.tier2,
                    stats.revenue.feeBreakdown.tier3,
                    stats.revenue.feeBreakdown.tier4,
                    stats.revenue.feeBreakdown.tier5,
                    stats.revenue.quidaxFees
                  ],
                  backgroundColor: ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'],
                  borderColor: ['#16A34A', '#2563EB', '#D97706', '#7C3AED', '#DB2777', '#DC2626']
                }]
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Trade Volume & Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={{
              labels: chartData?.map(d => d.date) || [],
              datasets: [
                {
                  label: 'Volume (NGN)',
                  data: chartData?.map(d => d.volume) || [],
                  backgroundColor: '#22C55E',
                  borderColor: '#16A34A',
                  yAxisID: 'y'
                },
                {
                  label: 'Transactions',
                  data: chartData?.map(d => d.transactions) || [],
                  backgroundColor: '#3B82F6',
                  borderColor: '#2563EB',
                  yAxisID: 'y1'
                }
              ]
            }}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  grid: {
                    drawOnChartArea: false
                  }
                }
              }
            }}
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