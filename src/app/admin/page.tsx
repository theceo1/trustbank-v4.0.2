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
import { BarChart, PieChart } from '@/components/ui/charts';

interface RevenueStats {
  totalRevenue: number;
  quidaxFees: number;
  netRevenue: number;
  feeBreakdown: {
    basic: number;
    verified: number;
    premium: number;
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
    basic: number;
    verified: number;
    premium: number;
  };
  topWallets?: { currency: string; balance: number }[];
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
        basic: 0,
        verified: 0,
        premium: 0
      }
    },
    userSegmentation: {
      basic: 0,
      verified: 0,
      premium: 0
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
    { name: 'Basic', value: stats.userSegmentation.basic },
    { name: 'Verified', value: stats.userSegmentation.verified },
    { name: 'Premium', value: stats.userSegmentation.premium }
  ];

  const revenueBreakdownData = [
    { name: 'Basic Users', value: stats.revenue.feeBreakdown.basic },
    { name: 'Verified Users', value: stats.revenue.feeBreakdown.verified },
    { name: 'Premium Users', value: stats.revenue.feeBreakdown.premium },
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
            <PieChart
              data={userSegmentationData}
              colors={['#94A3B8', '#64748B', '#475569']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={revenueBreakdownData}
              colors={['#22C55E', '#16A34A', '#15803D', '#DC2626']}
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