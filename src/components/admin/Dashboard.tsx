'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart } from "@/components/charts";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalWalletBalance: number;
  totalTransactions: number;
  dailyTransactionVolume: number;
}

interface ChartData {
  revenue: Array<{ name: string; Revenue: number }>;
  users: Array<{ name: string; 'New Users': number }>;
  wallets: Array<{ name: string; 'Total Balance': number }>;
  transactionVolume: Array<{ name: string; Volume: number }>;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  description: string | null;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalRevenue: 0,
  totalWalletBalance: 0,
  totalTransactions: 0,
  dailyTransactionVolume: 0
};

const defaultChartData: ChartData = {
  revenue: [],
  users: [],
  wallets: [],
  transactionVolume: []
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [chartData, setChartData] = useState<ChartData>(defaultChartData);
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResponse, chartsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/charts'),
        fetch('/api/admin/transactions?limit=4')
      ]);

      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      if (!chartsResponse.ok) throw new Error('Failed to fetch charts');
      if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');

      const [statsData, chartsData, transactionsData] = await Promise.all([
        statsResponse.json(),
        chartsResponse.json(),
        transactionsResponse.json()
      ]);

      setStats(statsData || defaultStats);
      setChartData(chartsData || defaultChartData);
      setRecentActivity(transactionsData?.transactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await fetchDashboardData();
      } catch (error) {
        if (mounted) {
          console.error('Error loading dashboard data:', error);
          setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor your bank's performance and user activity</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={fetchDashboardData}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {}} // TODO: Implement export functionality
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers?.toLocaleString() || '0'} active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-green-500">
              ${stats.dailyTransactionVolume?.toLocaleString() || '0'} today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalWalletBalance?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Across all wallets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={chartData.revenue || []} 
              categories={['Revenue']}
              colors={['#10B981']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={chartData.users || []} 
              categories={['New Users']}
              colors={['#10B981']}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.userName || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description || `${activity.type} transaction`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${activity.amount?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.createdAt ? formatTimeAgo(activity.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 