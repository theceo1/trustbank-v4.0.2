'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { BarChart, PieChart } from '@/components/ui/charts';

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
  totalRevenue: number;
  quidaxRevenue: number;
  platformRevenue: number;
  revenueGrowth: number;
  platformWallets: WalletData[];
  monthlyRevenue: RevenueData[];
  tradeVolume: TradeData[];
}

export default function PlatformPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      toast({
        title: "Error",
        description: "Failed to load platform statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          Quidax charges a 1.4% fee for handling payment and wallet services.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.totalRevenue || 0, 'NGN')
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${stats?.revenueGrowth.toFixed(2)}% from last month`
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quidax Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.quidaxRevenue || 0, 'NGN')
              )}
            </div>
            <div className="text-xs text-muted-foreground">1.4% of total volume</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatCurrency(stats?.platformRevenue || 0, 'NGN')
              )}
            </div>
            <div className="text-xs text-muted-foreground">0% of total volume</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[350px] w-full" />
              </div>
            ) : stats?.platformWallets && stats.platformWallets.length > 0 ? (
              <PieChart
                data={getWalletDistributionData()}
                valueFormatter={(value) => formatCurrency(value, 'NGN')}
                colors={['#22C55E', '#16A34A', '#15803D', '#166534']}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No wallet data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[350px] w-full" />
              </div>
            ) : stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
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
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-[350px] w-full" />
              </div>
            ) : stats?.tradeVolume && stats.tradeVolume.length > 0 ? (
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