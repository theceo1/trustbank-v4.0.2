'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  platformFees: number;
  quidaxFees: number;
  revenueBySource: {
    tradingFees: number;
    swapFees: number;
    transactionFees: number;
  };
  monthlyGrowth: number;
}

const COLORS = ['#16a34a', '#2563eb', '#d97706'];

export function RevenueMetrics() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const response = await fetch('/api/admin/revenue');
        if (!response.ok) throw new Error('Failed to fetch revenue data');
        const data = await response.json();
        setRevenueData(data);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (loading) {
    return <div>Loading revenue metrics...</div>;
  }

  if (!revenueData) {
    return <div>Failed to load revenue metrics</div>;
  }

  const pieData = [
    { name: 'Trading Fees', value: revenueData.revenueBySource.tradingFees },
    { name: 'Swap Fees', value: revenueData.revenueBySource.swapFees },
    { name: 'Transaction Fees', value: revenueData.revenueBySource.transactionFees },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Platform Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Total Revenue</h4>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                ${revenueData.totalRevenue.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {revenueData.monthlyGrowth >= 0 ? (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpRight className="h-3 w-3" />
                      +{revenueData.monthlyGrowth}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <ArrowDownRight className="h-3 w-3" />
                      {revenueData.monthlyGrowth}%
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Platform Fees</h5>
                <div className="text-lg font-semibold">${revenueData.platformFees.toLocaleString()}</div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground">Quidax Fees (1.4%)</h5>
                <div className="text-lg font-semibold">${revenueData.quidaxFees.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="text-center">
                <div className="text-xs font-medium text-muted-foreground">{entry.name}</div>
                <div className="text-sm font-semibold">${entry.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 