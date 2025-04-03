'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartsProps {
  className?: string;
}

export function AnalyticsCharts({ className }: AnalyticsChartsProps) {
  // Sample data - replace with actual data from your API
  const data = [
    { month: 'Jan', transactions: 65, users: 1200 },
    { month: 'Feb', transactions: 59, users: 1300 },
    { month: 'Mar', transactions: 80, users: 1400 },
    { month: 'Apr', transactions: 81, users: 1500 },
    { month: 'May', transactions: 56, users: 1700 },
    { month: 'Jun', transactions: 55, users: 1800 },
    { month: 'Jul', transactions: 40, users: 2000 },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="transactions"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="users"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 