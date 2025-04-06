'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Users, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { BarChart } from '@/components/ui/charts';

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

interface DashboardStats {
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
  topWallets?: Array<{
    currency: string;
    balance: string;
    converted_balance: string;
    name: string;
  }>;
}

interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data: DashboardStats | null;
  lastUpdated?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalWallets: 0,
    revenue: {
      totalRevenue: 0,
      quidaxFees: 0,
      netRevenue: 0,
      feeBreakdown: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0
      }
    },
    userSegmentation: {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
      tier5: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/platform/stats');
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      if (data.status === 'success' && data.data) {
        setStats(data.data);
        setLastUpdated(data.lastUpdated || null);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('[UI] Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userSegmentationData = [
    { name: 'Basic', value: stats.userSegmentation.tier1 },
    { name: 'Starter', value: stats.userSegmentation.tier2 },
    { name: 'Intermediate', value: stats.userSegmentation.tier3 },
    { name: 'Advanced', value: stats.userSegmentation.tier4 },
    { name: 'Premium', value: stats.userSegmentation.tier5 }
  ];

  const revenueBreakdownData = [
    { name: 'Basic', value: stats.revenue.feeBreakdown.tier1 },
    { name: 'Starter', value: stats.revenue.feeBreakdown.tier2 },
    { name: 'Intermediate', value: stats.revenue.feeBreakdown.tier3 },
    { name: 'Advanced', value: stats.revenue.feeBreakdown.tier4 },
    { name: 'Premium', value: stats.revenue.feeBreakdown.tier5 },
    { name: 'Quidax Fees', value: stats.revenue.quidaxFees }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[125px] w-full rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.revenue.netRevenue, 'NGN')}
                </div>
                <div className="text-xs text-muted-foreground">
                  After Quidax fees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <Wallet className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalVolume, 'NGN')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(stats.totalTransactions)} transactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalUsers)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(stats.activeUsers)} active users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quidax Fees</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.revenue.quidaxFees, 'NGN')}
                </div>
                <div className="text-xs text-muted-foreground">
                  1.4% of volume
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Wallets</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topWallets?.map((wallet, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{wallet.currency.toUpperCase()}</span>
                      <span>{formatCurrency(wallet.balance, wallet.currency)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={{
                labels: userSegmentationData.map(d => d.name),
                datasets: [{
                  label: 'Users',
                  data: userSegmentationData.map(d => d.value),
                  backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(59, 130, 246, 0.5)', 'rgba(99, 102, 241, 0.5)', 'rgba(165, 180, 252, 0.5)', 'rgba(239, 68, 68, 0.5)'],
                  borderColor: ['#22C55E', '#3B82F6', '#6366F1', '#A5B4FC', '#EF4444']
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
                labels: revenueBreakdownData.map(d => d.name),
                datasets: [{
                  label: 'Revenue',
                  data: revenueBreakdownData.map(d => d.value),
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.5)',
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(99, 102, 241, 0.5)',
                    'rgba(165, 180, 252, 0.5)',
                    'rgba(239, 68, 68, 0.5)'
                  ],
                  borderColor: ['#22C55E', '#3B82F6', '#6366F1', '#A5B4FC', '#EF4444']
                }]
              }}
            />
          </CardContent>
        </Card>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
} 