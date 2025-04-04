'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Wallet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currency: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastTransaction: string;
}

interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  activeWallets: number;
  inactiveWallets: number;
  currencyDistribution: Record<string, {
    count: number;
    totalBalance: number;
  }>;
}

interface ApiResponse {
  wallets: Wallet[];
  stats: WalletStats;
  pagination: {
    total: number;
    page: number;
    perPage: number;
  };
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#eab308', '#6366f1', '#ec4899'];

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchWallets();
  }, [search, currency]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (currency !== 'all') params.append('currency', currency);

      const response = await fetch(`/api/admin/wallets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const data: ApiResponse = await response.json();
      setWallets(data.wallets);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getCurrencyOptions = () => {
    if (!stats) return [];
    return Object.keys(stats.currencyDistribution).map((currency) => ({
      value: currency,
      label: currency.toUpperCase(),
    }));
  };

  const getDistributionData = () => {
    if (!stats) return [];
    return Object.entries(stats.currencyDistribution).map(([currency, data]) => ({
      name: currency.toUpperCase(),
      value: data.totalBalance,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : formatNumber(stats?.totalWallets || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${formatNumber(stats?.activeWallets || 0)} active wallets`
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `₦${formatNumber(stats?.totalBalance || 0)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${formatNumber(stats?.inactiveWallets || 0)} inactive wallets`
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Balance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getDistributionData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center mb-6">
        <Input
          placeholder="Search wallets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Currencies</SelectItem>
            {getCurrencyOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Transaction</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No wallets found
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.userName}</TableCell>
                  <TableCell>{wallet.userEmail}</TableCell>
                  <TableCell>{wallet.currency.toUpperCase()}</TableCell>
                  <TableCell>₦{formatNumber(wallet.balance)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(wallet.status)}>{wallet.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(wallet.lastTransaction)}</TableCell>
                  <TableCell>{formatDate(wallet.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 