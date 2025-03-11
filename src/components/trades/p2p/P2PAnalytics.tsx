import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface P2PAnalyticsProps {
  trades: any[];
  orders: any[];
}

export function P2PAnalytics({ trades, orders }: P2PAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');

  // Calculate statistics
  const totalTrades = trades.length;
  const completedTrades = trades.filter(t => t.status === 'completed').length;
  const successRate = totalTrades ? ((completedTrades / totalTrades) * 100).toFixed(1) : '0';
  const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Prepare chart data (mock data - replace with real data processing)
  const volumeData = [
    { name: 'Mon', volume: 12000 },
    { name: 'Tue', volume: 15000 },
    { name: 'Wed', volume: 18000 },
    { name: 'Thu', volume: 16000 },
    { name: 'Fri', volume: 21000 },
    { name: 'Sat', volume: 19000 },
    { name: 'Sun', volume: 23000 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600">
          <h3 className="text-lg font-medium text-white">Total Volume</h3>
          <p className="text-3xl font-bold text-white">₦{totalVolume.toLocaleString()}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600">
          <h3 className="text-lg font-medium text-white">Total Trades</h3>
          <p className="text-3xl font-bold text-white">{totalTrades}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600">
          <h3 className="text-lg font-medium text-white">Completed Trades</h3>
          <p className="text-3xl font-bold text-white">{completedTrades}</p>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600">
          <h3 className="text-lg font-medium text-white">Success Rate</h3>
          <p className="text-3xl font-bold text-white">{successRate}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Trading Activity</h3>
          <div className="space-x-2">
            {(['24h', '7d', '30d', '1y'] as const).map((t) => (
              <Button
                key={t}
                variant={timeframe === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(t)}
                className={timeframe === t ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="volume">
          <TabsList>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trades" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Popular Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Bank Transfer', value: 60 },
                  { name: 'PayPal', value: 15 },
                  { name: 'USSD', value: 10 },
                  { name: 'Mobile Money', value: 15 },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#16a34a"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Trade Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: completedTrades },
                  { name: 'Pending', value: totalTrades - completedTrades },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#16a34a"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
} 