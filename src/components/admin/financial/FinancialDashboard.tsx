import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { LineChart, BarChart } from '@/components/ui/charts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FinancialMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionSize: number;
  transactionFees: number;
  dailyVolume: {
    date: string;
    volume: number;
  }[];
  topCurrencies: {
    currency: string;
    volume: number;
  }[];
}

export function FinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch financial metrics from Supabase
      const { data, error } = await supabase
        .rpc('get_financial_metrics', { p_timeframe: timeframe });

      if (error) throw error;

      setMetrics(data);
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Financial Overview</h2>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="1y">1y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue, 'USD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalTransactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.averageTransactionSize, 'USD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.transactionFees, 'USD')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={metrics.dailyVolume}
              xField="date"
              yField="volume"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={metrics.topCurrencies}
              xField="currency"
              yField="volume"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 