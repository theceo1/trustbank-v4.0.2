import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, BarChart } from '@/components/ui/charts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AnalyticsData {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: {
      date: string;
      count: number;
    }[];
  };
  transactionMetrics: {
    successRate: number;
    averageProcessingTime: number;
    volumeByType: {
      type: string;
      volume: number;
    }[];
  };
  kycMetrics: {
    verificationRate: number;
    averageCompletionTime: number;
    statusDistribution: {
      status: string;
      count: number;
    }[];
  };
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');
  const [metricType, setMetricType] = useState<'users' | 'transactions' | 'kyc'>('users');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, metricType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from Supabase
      const { data, error } = await supabase
        .rpc('get_analytics_data', { 
          p_timeframe: timeframe,
          p_metric_type: metricType 
        });

      if (error) throw error;

      setData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-4">
          <Select value={metricType} onValueChange={(v) => setMetricType(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">User Metrics</SelectItem>
              <SelectItem value="transactions">Transaction Metrics</SelectItem>
              <SelectItem value="kyc">KYC Metrics</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
              <TabsTrigger value="1y">1y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <TabsContent value="users" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.userMetrics.totalUsers.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.userMetrics.activeUsers.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>New Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.userMetrics.newUsers.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={data.userMetrics.userGrowth}
              xField="date"
              yField="count"
              height={300}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transactions" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(data.transactionMetrics.successRate * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.transactionMetrics.averageProcessingTime.toFixed(2)}s
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Volume by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.transactionMetrics.volumeByType}
              xField="type"
              yField="volume"
              height={300}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="kyc" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Verification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(data.kycMetrics.verificationRate * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.kycMetrics.averageCompletionTime.toFixed(2)} hours
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.kycMetrics.statusDistribution}
              xField="status"
              yField="count"
              height={300}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
} 