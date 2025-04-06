'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart } from "@/components/ui/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OverviewData {
  labels: string[];
  revenue: number[];
  users: number[];
  totalRevenue: number;
  totalUsers: number;
  averageRevenue: number;
  averageUsers: number;
}

interface TransactionStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  swaps: number;
  regular: number;
}

interface TransactionsData {
  labels: string[];
  monthlyStats: TransactionStats[];
  totals: TransactionStats;
  successRates: number[];
}

interface MonthlyStats {
  new_users: number;
  active_users: number;
  total_transactions: number;
}

interface UsersData {
  total_users: number;
  kyc_stats: {
    verified: number;
    pending: number;
    rejected: number;
  };
  verification_stats: {
    email_verified: number;
    phone_verified: number;
  };
  monthly_stats: MonthlyStats[];
  labels: string[];
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [transactionsData, setTransactionsData] = useState<TransactionsData | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('Fetching analytics data...');
      const [overviewResponse, transactionsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/analytics/overview'),
        fetch('/api/admin/analytics/transactions'),
        fetch('/api/admin/analytics/users')
      ]);

      const transactionsApiData = await transactionsResponse.json();

      console.log('[DEBUG] Raw transactions API data:', transactionsApiData);

      const transactionsData = {
        labels: Array(12).fill('').map((_,i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11-i));
          return date.toLocaleString('default', {month: 'short'});
        }),
        monthlyStats: transactionsApiData.monthlyStats || [],
        totals: {
          total: transactionsApiData.transactionCount || 0,
          successful: transactionsApiData.stats?.successfulTransactions || 0,
          failed: transactionsApiData.stats?.failedTransactions || 0,
          pending: transactionsApiData.stats?.pendingTransactions || 0,
          swaps: transactionsApiData.stats?.swapTransactions || 0,
          regular: (transactionsApiData.transactionCount || 0) - (transactionsApiData.stats?.swapTransactions || 0)
        },
        successRates: transactionsApiData.successRates || Array(12).fill(0)
      };

      console.log('[DEBUG] Processed transactions data:', transactionsData);
      setTransactionsData(transactionsData);

      const overviewData = await overviewResponse.json();
      const usersData = await usersResponse.json();

      console.log('Overview data:', overviewData);
      console.log('Users data:', usersData);

      // Transform monthly_stats from array of arrays to array of objects
      if (usersData && Array.isArray(usersData.monthly_stats)) {
        const [newUsers, activeUsers, totalTransactions] = usersData.monthly_stats;
        usersData.monthly_stats = Array(12).fill(0).map((_, index) => ({
          new_users: newUsers?.[index] || 0,
          active_users: activeUsers?.[index] || 0,
          total_transactions: totalTransactions?.[index] || 0
        }));
      }

      setOverviewData(overviewData);
      setUsersData(usersData);
    } catch (error) {
      console.error('[TRANSACTIONS DEBUG] Error:', error);
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  console.log('OverviewData state:', overviewData);
  console.log('TransactionsData state:', transactionsData);
  console.log('UsersData state:', usersData);

  if (!overviewData || !transactionsData || !usersData) {
    return <Alert variant="destructive" className="mb-6"><AlertDescription>No data available</AlertDescription></Alert>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="border-b">
          <TabsTrigger 
            value="overview" 
            className={`${activeTab === "overview" ? "text-green-600 border-b-2 border-green-600" : ""}`}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className={`${activeTab === "transactions" ? "text-green-600 border-b-2 border-green-600" : ""}`}
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className={`${activeTab === "users" ? "text-green-600 border-b-2 border-green-600" : ""}`}
          >
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <LineChart
                    data={{
                      labels: overviewData?.labels || [],
                      datasets: [{
                        label: 'Monthly Revenue',
                        data: overviewData?.revenue || [],
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1
                      }]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <BarChart
                    data={{
                      labels: overviewData?.labels || [],
                      datasets: [{
                        label: 'New Users',
                        data: overviewData?.users || [],
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: '#3B82F6'
                      }]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-bold">
                      ${loading ? '...' : overviewData?.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Monthly Revenue:</span>
                    <span className="font-bold">
                      ${loading ? '...' : overviewData?.averageRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-bold">
                      {loading ? '...' : overviewData?.totalUsers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Monthly Users:</span>
                    <span className="font-bold">
                      {loading ? '...' : overviewData?.averageUsers.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <LineChart
                    data={{
                      labels: transactionsData?.labels || [],
                      datasets: [{
                        label: 'Total Transactions',
                        data: transactionsData?.monthlyStats.map(s => s.total) || [],
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1
                      }]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <BarChart
                    data={{
                      labels: transactionsData?.labels || [],
                      datasets: [
                        {
                          label: 'Regular',
                          data: transactionsData?.monthlyStats.map(s => s.regular) || [],
                          backgroundColor: 'rgba(59, 130, 246, 0.5)',
                          borderColor: '#3B82F6'
                        },
                        {
                          label: 'Swaps',
                          data: transactionsData?.monthlyStats.map(s => s.swaps) || [],
                          backgroundColor: 'rgba(34, 197, 94, 0.5)',
                          borderColor: '#22C55E'
                        }
                      ]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-bold">
                      {loading ? '...' : transactionsData?.totals.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-bold">
                      {loading ? '...' : `${((transactionsData?.totals.successful || 0) / (transactionsData?.totals.total || 1) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regular Transactions:</span>
                    <span className="font-bold">
                      {loading ? '...' : transactionsData?.totals.regular}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Swap Transactions:</span>
                    <span className="font-bold">
                      {loading ? '...' : transactionsData?.totals.swaps}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <LineChart
                    data={{
                      labels: transactionsData?.labels || [],
                      datasets: [{
                        label: 'Success Rate (%)',
                        data: transactionsData?.successRates || [],
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1
                      }]
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <LineChart
                    data={{
                      labels: usersData?.labels || [],
                      datasets: [{
                        label: 'New Users',
                        data: Array.isArray(usersData?.monthly_stats) 
                          ? usersData.monthly_stats.map(s => s.new_users) 
                          : [],
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.1
                      }]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <BarChart
                    data={{
                      labels: usersData?.labels || [],
                      datasets: [
                        {
                          label: 'Active Users',
                          data: Array.isArray(usersData?.monthly_stats)
                            ? usersData.monthly_stats.map(s => s.active_users)
                            : [],
                          backgroundColor: 'rgba(34, 197, 94, 0.5)',
                          borderColor: '#22C55E'
                        },
                        {
                          label: 'Total Transactions',
                          data: Array.isArray(usersData?.monthly_stats)
                            ? usersData.monthly_stats.map(s => s.total_transactions)
                            : [],
                          backgroundColor: 'rgba(59, 130, 246, 0.5)',
                          borderColor: '#3B82F6'
                        }
                      ]
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-bold">
                      {loading ? '...' : usersData?.total_users}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-bold">
                      {loading ? '...' : Array.isArray(usersData?.monthly_stats)
                        ? usersData.monthly_stats.reduce((acc, curr) => acc + (curr.active_users || 0), 0)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active User Rate:</span>
                    <span className="font-bold">
                      {loading ? '...' : `${((Array.isArray(usersData?.monthly_stats)
                        ? usersData.monthly_stats.reduce((acc, curr) => acc + (curr.active_users || 0), 0)
                        : 0) / (usersData?.total_users || 1) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Transactions per User:</span>
                    <span className="font-bold">
                      {loading ? '...' : `${((Array.isArray(usersData?.monthly_stats)
                        ? usersData.monthly_stats.reduce((acc, curr) => acc + (curr.total_transactions || 0), 0)
                        : 0) / (usersData?.total_users || 1)).toFixed(1)}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 